import "./styles/styles.css";
import { useState, useMemo, useEffect, useCallback } from "react";
import CodeEditor from "./CodeEditor"; // Assuming you have this component
import UploadModal from "./components/UploadModal";
import FileTree from "./components/FileTree";
import ToastContainer from "./components/ToastContainer";
import { useToasts } from "./hooks/useToasts.js";
import { useFileManager } from "./hooks/useFileManager.js";
import { useScanner } from "./hooks/useScanner.js";

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState("editor"); // 'editor' or 'errors'
  const [jumpToLine, setJumpToLine] = useState(null); // For jumping to a line from the error report
  const [pendingJump, setPendingJump] = useState(null); // Holds a jump request until content is loaded  
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, addToast, removeToast } = useToasts();
	const [globalErrorIndex, setGlobalErrorIndex] = useState(0);

  const {
    files,
    setFiles,
    selectedPath,
    setSelectedPath,
    currentCode,
    selectedFile,
    hasUnsavedChanges,
    handleEditorChange,
    refreshList,
    handleFiles,
    handleSaveAll,
  } = useFileManager(addToast);

  const { scanReport, setScanReport, isScanning, scan, rescanFile } = useScanner(addToast);

  // This derived state is now reliable. It safely checks for the existence of
  // scanReport and its properties before trying to access them.
  const issuesDetected = useMemo(() => scanReport?.summary?.issues > 0, [scanReport]);

  const allErrors = useMemo(() => {
    if (!scanReport?.byFile) return [];
    // Create a flat list of all errors, including their file path
    return Object.entries(scanReport.byFile).flatMap(([filePath, errors]) =>
      errors.map(error => ({ ...error, filePath }))
    );
  }, [scanReport]);

  // When the list of errors changes (i.e., after a rescan), make sure the index is still valid.
  useEffect(() => {
    // When the list of errors changes, ensure the index is still valid.
    if (globalErrorIndex >= allErrors.length) {
      setGlobalErrorIndex(Math.max(0, allErrors.length - 1));
    }
  }, [allErrors, globalErrorIndex]);

  const errorsForSelectedFile = useMemo(() => {
    if (!scanReport?.byFile || !selectedPath || !scanReport.byFile[selectedPath]) {
      return [];
    }
    return scanReport.byFile[selectedPath];
  }, [scanReport, selectedPath]);

  // Initial load: refresh the list to show any existing files.
  // This will run once when the component mounts.
  useEffect(() => {
    refreshList();
  }, []);

  // This effect triggers a jump-to-line *after* ensuring the file's content is loaded.
  // This prevents a race condition where the jump happens before the new file is displayed.
  useEffect(() => {
    if (pendingJump && selectedFile?.path === pendingJump.path) {
      // Check the master `files` array to see if the content is populated.
      const fileInState = files.find(f => f.path === pendingJump.path);
      if (fileInState?.content != null) {
        // Content is loaded, so we can now trigger the actual jump.
        setJumpToLine({ ...pendingJump, key: Date.now() });
        setPendingJump(null); // Clear the pending request.
      }
    }
  }, [files, pendingJump, selectedFile]);

  const handleScan = () => {
    setViewMode("errors"); // Switch to errors view to show progress/results
    scan();
  };

  async function selectByPath(path, line = null) {
    setSelectedPath(path);
		setViewMode("editor");
    if (line) {
      // Don't jump immediately. Set a pending request that the useEffect will handle once content is loaded.
      setPendingJump({ path, line });
    }
  }

  const navigateToError = (index) => {
    if (!allErrors || index < 0 || index >= allErrors.length) return;
    const error = allErrors[index];
      setGlobalErrorIndex(index);
      // selectByPath will switch to the correct file and trigger the jump-to-line
      selectByPath(error.filePath, error.line);
  }

  async function handleSaveAndRescan() {
    if (!selectedPath || isSaving || isScanning) return;
    setIsSaving(true); // Use the same saving flag to disable both buttons

    try {
      // 1. Save the file first
      const saveResponse = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedPath, content: currentCode }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save: ${saveResponse.statusText}`);
      }

      // Update local state, reset unsaved changes flag, and show toast
      setFiles(prevFiles => prevFiles.map(file => (file.path === selectedPath ? { ...file, content: currentCode, hasUnsavedChanges: false } : file)));

      // 2. Now, rescan just that file using the hook
      const scanData = await rescanFile(selectedPath);
      if (!scanData) { // Error was already handled in the hook
        return;
      }
      
      if (scanData.ok) {
        // 3. Merge the new partial report into the existing full report
        // We read the previous report from the state variable in the render scope
        // to avoid putting side effects (addToast) inside the setScanReport updater,
        // which can cause double-invocations in React's Strict Mode.
        const prevReport = scanReport;

        if (!prevReport || prevReport.error) {
          addToast('Run a full scan first to establish a baseline.', 'warn');
          setScanReport(scanData); // Show partial report if no baseline exists
        } else {
          const newByFile = { ...prevReport.byFile };
          const fileHasNewErrors = scanData.byFile && scanData.byFile[selectedPath] && scanData.byFile[selectedPath].length > 0;

          if (fileHasNewErrors) {
            newByFile[selectedPath] = scanData.byFile[selectedPath];
          } else {
            delete newByFile[selectedPath]; // File is now clean, remove from error list
          }

          // Recalculate summary and provide feedback
          const oldErrorCount = prevReport.byFile[selectedPath]?.length || 0;
          const newErrorCount = newByFile[selectedPath]?.length || 0;
          const issuesFixed = oldErrorCount - newErrorCount;
          
          if (newErrorCount === 0 && oldErrorCount > 0) {
            addToast(`All ${oldErrorCount} issue(s) fixed in this file! File saved.`, 'success');
          } else if (issuesFixed > 0) {
            addToast(`${issuesFixed} issue(s) fixed. ${newErrorCount} remaining. File saved.`, 'warn');
          } else if (issuesFixed < 0) {
            addToast(`File saved, but ${-issuesFixed} new issue(s) were introduced. ${newErrorCount} total remaining.`, 'error');
          } else if (newErrorCount > 0) {
            addToast(`File saved, ${newErrorCount} error(s) still remaining.`, 'warn');
          } else {
            addToast('File saved. No issues found.', 'info');
          }
          
          const totalIssues = Object.values(newByFile).reduce((sum, errors) => sum + (errors?.length || 0), 0);
          const newSummary = { ...prevReport.summary, filesWithIssues: Object.keys(newByFile).length, issues: totalIssues };
          
          setScanReport({ ...prevReport, summary: newSummary, byFile: newByFile });
        }
      } else {
        throw new Error(scanData.error || 'An unknown error occurred during the rescan.');
      }
    } catch (err) {
      console.error('Error during save and rescan:', err);
      addToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  const handleSaveAllClick = async () => {
    setIsSaving(true);
    await handleSaveAll();
    setIsSaving(false);
  };

  return (
    <div className="app-container">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Top Bar 🔝 */}
      <header className="top-bar">
        <h1>Code Cleaner</h1>
        <div className="actions">
          <button onClick={() => setShowModal(true)}>Upload Folder</button>
          <button onClick={() => setViewMode(prev => prev === 'editor' ? 'errors' : 'editor')}>
            {viewMode === 'editor' ? 'View Errors' : 'View Editor'}
          </button>
          <button onClick={handleScan} disabled={!files.length || isScanning}>
            {isScanning ? "Scanning..." : "Scan Files"}
          </button>
          <button onClick={handleSaveAllClick} disabled={!hasUnsavedChanges || isSaving || isScanning}>
            Save All
          </button>
          <button onClick={() => window.location.href = "/api/download"} disabled={!files.length}>
            Download Cleaned
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* Sidebar Panel 📁 */}
        <aside className="sidebar-panel">
          {scanReport && typeof scanReport.summary?.issues === 'number' && (
            <div
              className="sidebar-scan-summary"
              onClick={() => issuesDetected && setViewMode('errors')}
              title={issuesDetected ? "Click to view error report" : "No issues found"}
              style={{ cursor: issuesDetected ? 'pointer' : 'default' }}
            >
              <strong>Total Issues: {scanReport.summary.issues}</strong>
            </div>
          )}
          <FileTree files={files} onFileSelect={selectByPath} selectedPath={selectedPath} />
        </aside>

        {/* Main Panel 📝 */}
        {viewMode === 'editor' ? (
          <main className="editor-panel">
            <div className="editor-title-bar">
              <h2>{selectedFile ? selectedFile.path : "No file selected"}</h2>
              {errorsForSelectedFile.length > 0 && (
                <span className="error-count-badge">
                  {errorsForSelectedFile.length} {errorsForSelectedFile.length === 1 ? 'Error' : 'Errors'}
                </span>
              )}
            </div>
            {errorsForSelectedFile.length > 0 && (
              <div className="editor-error-list">
                <ul>
                  {errorsForSelectedFile.map((error, index) => (
                    <li
                      key={index}
                      className={error.line ? "clickable" : ""}
                      onClick={error.line ? () => selectByPath(selectedPath, error.line) : undefined}
                      title={error.line ? `Click to jump to line ${error.line}` : ''}
                    >
                      {error.line ? `Line ${error.line}: ` : ''}{error.message}

                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Only render CodeEditor if selectedFile exists AND is a readable type */}
            {selectedFile && /\.(html?|css|js|txt)$/i.test(selectedFile.path) ? (
              <>
                <CodeEditor code={currentCode} onChange={handleEditorChange} filePath={selectedFile?.path} jumpToLine={jumpToLine} />
                <div className="editor-actions">
                  <button onClick={handleSaveAndRescan} disabled={isSaving || isScanning}>
                    {isSaving ? 'Processing...' : 'Save & Check for Fixes'}
                  </button>
                  {allErrors.length > 0 && (
                    <div className="error-navigation">
                      <button onClick={() => navigateToError(globalErrorIndex - 1)} disabled={globalErrorIndex <= 0 || isSaving || isScanning}>
                        Previous Error
                      </button>
                      <span>{globalErrorIndex + 1} / {allErrors.length}</span>
                      <button onClick={() => navigateToError(globalErrorIndex + 1)} disabled={globalErrorIndex >= allErrors.length - 1 || isSaving || isScanning}>
                        Next Error
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Message for non-readable files or no selection.
              <p className="scan-text">
                {selectedFile ? "This file type isn't previewable. Choose an HTML/CSS/JS/TXT file." : "No file selected"}
              </p>
            )}
          </main>
        ) : (
          <main className="editor-panel">
            <h2>Scan Report</h2>
            <div className="codemirror-wrapper">
              <div className="error-report">
                {isScanning ? (
                  <p className="scan-text">
                    Scanning files, please wait...
                  </p>
                ) : scanReport === null ? (
                  <p className="scan-text">
                    No scan has been performed yet. Click 'Scan Files' to begin.
                  </p>
                ) : scanReport.error ? (
                  <div className="structured-report">
                    <h3>Scan Error</h3>
                    <p className="scan-text scan-error">{scanReport.error}</p>
                    <p className="scan-text">
                      Check the browser's developer console for more details.
                    </p>
                  </div>
                ) : scanReport.summary.issues === 0 ? (
                  <p className="scan-text">
                    No errors found! ✨
                  </p>
                ) : (
                  <div className="structured-report">
                    <h3>Scan Summary</h3>
                    <ul>
                      <li>Files Scanned: {scanReport.summary.filesScanned}</li>
                      <li>Files with Issues: {scanReport.summary.filesWithIssues}</li>
                      <li>Total Issues: {scanReport.summary.issues}</li>
                    </ul>
                    <hr />
                    {Object.entries(scanReport.byFile).map(([filePath, errors]) => (
                      <div key={filePath} className="report-file-section">
                        <h4
                          className="report-file-path"
                          onClick={() => selectByPath(filePath)}
                        >
                          {filePath}
                        </h4>
                        <ul>
                          {errors.map((error, index) => {
                            // The backend now sends a structured error with a `line` property.
                            const { message, line } = error;

                            return (
                              <li
                                key={index}
                                className={line ? "report-error-message" : ""}
                                onClick={line ? () => selectByPath(filePath, line) : undefined}
                                title={line ? `Click to jump to line ${line} in ${filePath}` : message}
                              >
                                {line ? `${message} (line ${line})` : message}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </main>
        )}
      </div>

      {showModal && (
        <UploadModal
          onClose={async (uploadedFiles) => {
            setShowModal(false);
            if (uploadedFiles && uploadedFiles.length > 0) {
              // The handleFiles function is now part of the useFileManager hook
              await handleFiles(uploadedFiles);
            } else {
              // Otherwise (modal closed, or no files selected), refresh from server.
              await refreshList();
            }
          }}
        />
      )}
    </div>
  );
}