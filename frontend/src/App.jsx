import "./styles/styles.css";
import { useState, useMemo, useEffect } from "react";
import CodeEditor from "./CodeEditor"; // Assuming you have this component
import UploadModal from "./components/UploadModal";
import FileTree from "./components/FileTree";

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState([]); // Will store [{name, path, content?, _file?}]
  const [selectedPath, setSelectedPath] = useState(""); // Path of the selected file when clicked in tree
  const [currentCode, setCurrentCode] = useState(""); // Initialize to empty string
  const [viewMode, setViewMode] = useState("editor"); // 'editor' or 'errors'
  const [scanReport, setScanReport] = useState(null); // To store the scan report
  const [isScanning, setIsScanning] = useState(false);
  const [jumpToLine, setJumpToLine] = useState(null); // For jumping to a line from the error report
  const [pendingJump, setPendingJump] = useState(null); // Holds a jump request until content is loaded

  // selectedFile should derive from files and selectedPath, always using 'path' for lookup.
  const selectedFile = useMemo(() => files.find(f => f.path === selectedPath), [files, selectedPath]);

  // Use useEffect to react to selectedFile changes and update currentCode.
  // This is the core change to make the editor dynamic.
  useEffect(() => {
    if (selectedFile) {
      // If content is already in memory, use it.
      if (selectedFile.content != null) {
        setCurrentCode(selectedFile.content);
      } else if (/\.(html?|css|js|txt)$/i.test(selectedFile.path)) {
        // If it's a readable file type but content is not in memory, fetch it.
        // This handles cases where refreshList populated `files` without content.
        fetchFileContent(selectedFile.path);
      } else {
        // For non-readable file types (images, zips, etc.), clear the editor.
        setCurrentCode("");
      }
    } else {
      // No file selected, clear the editor.
      setCurrentCode("");
    }
  }, [selectedFile, files]); // Depend on selectedFile and files (to catch content updates).

  // Helper function to fetch file content from the server.
  async function fetchFileContent(path) {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
      }
      const text = await res.text();
      setCurrentCode(text); // Update editor with fetched content.

      // Cache it in memory for future selections.
      setFiles(prev => prev.map(file =>
        file.path === path ? { ...file, content: text } : file
      ));
    } catch (err) {
      console.error("Error fetching file content:", err);
      setCurrentCode(`Error loading file: ${err.message}`); // Display error in editor.
    }
  }

	// This function now handles BOTH processing for state AND uploading to server.
  async function handleFiles(browserFileList) {
    if (!browserFileList || browserFileList.length === 0) return;

    const fd = new FormData();
    const processedFilesForState = [];

    for (let i = 0; i < browserFileList.length; i++) {
      const file = browserFileList[i];
      
      const filePathInTree = file.webkitRelativePath || file.name;

      // 1. Append the actual file content.
      // Multer will now default file.originalname to file.name or the browser's default.
      fd.append("files", file); 

      // 2. Explicitly append the full relative path as a separate field.
      // This is what Multer will collect into req.body.filePaths on the server.
      fd.append("filePaths", filePathInTree); 

      processedFilesForState.push({
        name: file.name,
        path: filePathInTree,
        _file: file,
        content: undefined,
      });
    }

    try {
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.statusText}`);
      }
			
      const readableFiles = processedFilesForState.filter(({ path }) => /\.(html?|css|js|txt)$/i.test(path));
      const filesWithContentPromises = readableFiles.map(async (item) => ({
        ...item,
        content: await item._file.text(),
      }));
      const filesWithContent = await Promise.all(filesWithContentPromises);

      // Note: 'allFilesForState' was undefined in your provided code.
      // It should be 'processedFilesForState'. Correcting this below.
      const mergedFiles = processedFilesForState.map(item => { // Corrected variable name here
        const found = filesWithContent.find(w => w.path === item.path);
        return found ? found : item;
      });

      setFiles(mergedFiles);

      const firstReadable = mergedFiles.find(f => /\.(html?|css|js|txt)$/i.test(f.path));
      if (firstReadable) {
        setSelectedPath(firstReadable.path);
      } else if (mergedFiles.length > 0) {
        setSelectedPath(mergedFiles[0].path);
      } else {
        setSelectedPath("");
        setCurrentCode("");
      }

    } catch (err) {
      console.error("Error during upload or processing:", err);
    }
  }
	
  async function refreshList() {
    try {
      const res = await fetch("/api/list");
      const { files: serverFiles } = await res.json(); // Renamed to serverFiles to avoid confusion.

      const formattedFiles = serverFiles.map(f => ({
        name: f.path.split('/').pop(), // Correctly extract just the file/folder name.
        path: f.path,
        content: undefined, // Explicitly set content to undefined, as it's not loaded yet.
      }));

      setFiles(formattedFiles);

      // Auto-select first readable file if nothing is selected or the selected file no longer exists.
      if (!selectedPath || !formattedFiles.some(f => f.path === selectedPath)) {
        const firstReadable = formattedFiles.find(f => /\.(html?|css|js|txt)$/i.test(f.path));
        if (firstReadable) {
          setSelectedPath(firstReadable.path);
        } else if (formattedFiles.length > 0) {
          setSelectedPath(formattedFiles[0].path);
        } else {
          setSelectedPath("");
          setCurrentCode("");
        }
      }
      // If selectedPath still points to an existing file, useEffect will handle loading its content
      // if it's not already loaded.
    } catch (err) {
      console.error("Error refreshing file list:", err);
    }
  }

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

  async function scan() {
    if (isScanning) return;
    setIsScanning(true);
    setScanReport(null); // Clear previous report
    setViewMode("errors"); // Switch to errors view to show progress/results

    try {
      const res = await fetch("/api/scan", { method: "POST" });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Could not read error response.");
        console.error("Scan failed with status:", res.status, errorText);
        throw new Error(`Scan failed: Server responded with status ${res.status}.`);
      }

      const data = await res.json();
      console.log("Scan response data:", data);

      if (data.ok) {
        setScanReport(data);
      } else {
        throw new Error(data.error || "An unknown error occurred during the scan.");
      }
    } catch (err) {
      console.error("An error occurred while scanning:", err);
      setScanReport({ error: err.message });
    } finally {
      setIsScanning(false);
    }
  }

  async function selectByPath(path, line = null) {
    setSelectedPath(path);
    setViewMode("editor");
    if (line) {
      // Don't jump immediately. Set a pending request that the useEffect will handle once content is loaded.
      setPendingJump({ path, line });
    }
  }

  function saveEdits() {
    if (!selectedPath) return;
    setFiles(prev => prev.map(f => (f.path === selectedPath ? { ...f, content: currentCode } : f)));
    // TODO: send to backend to write to disk.
    console.log("Saving edits for:", selectedPath); // For demonstration.
  }

  return (
    <div className="app-container">
      {/* Top Bar 🔝 */}
      <header className="top-bar">
        <h1>Code Cleaner</h1>
        <div className="actions">
          <button onClick={() => setShowModal(true)}>Upload Folder</button>
          <button onClick={() => setViewMode(prev => prev === 'editor' ? 'errors' : 'editor')}>
            {viewMode === 'editor' ? 'View Errors' : 'View Editor'}
          </button>
          <button onClick={scan} disabled={!files.length || isScanning}>
            {isScanning ? "Scanning..." : "Scan Files"}
          </button>
          <button onClick={() => window.location.href = "/api/download"} disabled={!files.length}>
            Download Cleaned
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* Sidebar showing nested folders 📁 */}
        <FileTree files={files} onFileSelect={selectByPath} />

        {/* Main Panel 📝 */}
        {viewMode === 'editor' ? (
          <main className="editor-panel">
            {/* Display full path here for clarity */}
            <h2>{selectedFile ? selectedFile.path : "No file selected"}</h2>
            {/* Only render CodeEditor if selectedFile exists AND is a readable type */}
            {selectedFile && /\.(html?|css|js|txt)$/i.test(selectedFile.path) ? (
              <>
                <CodeEditor code={currentCode} onChange={setCurrentCode} filePath={selectedFile?.path} jumpToLine={jumpToLine} />
                <div className="editor-actions">
                  <button onClick={saveEdits}>Save</button>
                  <button disabled>Save & Next</button>
                </div>
              </>
            ) : (
              // Message for non-readable files or no selection.
              <p style={{opacity:0.7}}>
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
                  <p style={{ opacity: 0.7, padding: '1rem' }}>
                    Scanning files, please wait...
                  </p>
                ) : scanReport === null ? (
                  <p style={{ opacity: 0.7, padding: '1rem' }}>
                    No scan has been performed yet. Click 'Scan Files' to begin.
                  </p>
                ) : scanReport.error ? (
                  <div className="structured-report">
                    <h3>Scan Error</h3>
                    <p style={{ color: 'red' }}>{scanReport.error}</p>
                    <p style={{ opacity: 0.7 }}>
                      Check the browser's developer console for more details.
                    </p>
                  </div>
                ) : scanReport.summary.issues === 0 ? (
                  <p style={{ opacity: 0.7, padding: '1rem' }}>
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
              // If files were uploaded via the modal, process them directly.
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