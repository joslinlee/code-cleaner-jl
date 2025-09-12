import "./styles/styles.css";
import { useState, useMemo, useEffect } from "react";
import CodeEditor from "./CodeEditor"; // Assuming you have this component
import UploadModal from "./components/UploadModal";
import FileTree from "./components/FileTree";
import ToastContainer from "./components/ToastContainer";

export default function App() {
  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState([]); // Will store [{name, path, content?, _file?}]
  const [selectedPath, setSelectedPath] = useState(""); // Path of the selected file when clicked in tree
  const [currentCode, setCurrentCode] = useState(""); // Initialize to empty string
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

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
      setFiles(prevFiles => prevFiles.map(file =>
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
      fd.append("files", file); // <-- CHANGE 1: Removed filePathInTree from here

      // 2. Explicitly append the full relative path as a separate field.
      // This is what Multer will collect into req.body.filePaths on the server.
      fd.append("filePaths", filePathInTree); // <-- CHANGE 2: Added this new line

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

  async function scan() {
    const res = await fetch("/api/scan", { method: "POST" });
    const data = await res.json();
    if (data.ok) {
      // Show the text report somewhere, or parse it later.
      console.log(data.report);
    }
  }

  async function selectByPath(path) {
    setSelectedPath(path);
    // The useEffect hook will now handle setting currentCode based on selectedFile
    // and fetching if necessary. This keeps the logic centralized.
  }

  // --- Toast Management ---
  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prevToasts => [...prevToasts, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  async function saveEdits() {
    if (!selectedPath || isSaving) return;
    setIsSaving(true);

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedPath,
          content: currentCode,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); // Avoid another error if body is not json
        throw new Error(errorData.message || `Failed to save: ${response.statusText}`);
      }

      // Update local state only after successful save
      setFiles(prevFiles => prevFiles.map(file => (file.path === selectedPath ? { ...file, content: currentCode } : file)));
      
      addToast('File saved successfully!', 'success');

    } catch (err) {
      console.error("Error saving file:", err);
      addToast(`Error: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="app-container">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Top Bar 🔝 */}
      <header className="top-bar">
        <h1>Code Cleaner</h1>
        <div className="actions">
          <button onClick={() => setShowModal(true)}>Upload Folder</button>
          <button onClick={scan} disabled={!files.length}>Scan Files</button>
          <button onClick={() => window.location.href = "/api/download"} disabled={!files.length}>
            Download Cleaned
          </button>
        </div>
      </header>

      <div className="main-content">
        {/* Sidebar showing nested folders 📁 */}
        <FileTree files={files} onFileSelect={selectByPath} />

        {/* Main Panel 📝 */}
        <main className="editor-panel">
          {/* Display full path here for clarity */}
          <h2>{selectedFile ? selectedFile.path : "No file selected"}</h2>
          {/* Only render CodeEditor if selectedFile exists AND is a readable type */}
          {selectedFile && /\.(html?|css|js|txt)$/i.test(selectedFile.path) ? (
            <>
              <CodeEditor code={currentCode} onChange={setCurrentCode} filePath={selectedFile?.path} />
              <div className="editor-actions">
                <button onClick={saveEdits} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
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