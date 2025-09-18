import { useState, useMemo, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing file state and interactions.
 * @param {(message: string, type?: string) => void} addToast - Function to show toast notifications.
 * @returns {object} - An object containing file state and management functions.
 */
export function useFileManager(addToast) {
  const [files, setFiles] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [currentCode, setCurrentCode] = useState("");

  const selectedFile = useMemo(() => files.find(f => f.path === selectedPath), [files, selectedPath]);
  const hasUnsavedChanges = useMemo(() => files.some(f => f.hasUnsavedChanges), [files]);

  const fetchFileContent = useCallback(async (path) => {
    try {
      const res = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
      }
      const text = await res.text();
      setCurrentCode(text);

      setFiles(prevFiles => prevFiles.map(file =>
        file.path === path ? { ...file, content: text } : file
      ));
    } catch (err) {
      console.error("Error fetching file content:", err);
      addToast(`Error fetching file: ${err.message}`, 'error');
			setCurrentCode(`Error loading file: ${err.message}`);
    }
  }, [addToast]);

  useEffect(() => {
    if (selectedFile) {
      if (selectedFile.content != null) {
        setCurrentCode(selectedFile.content);
      } else if (/\.(html?|css|js|txt)$/i.test(selectedFile.path)) {
        fetchFileContent(selectedFile.path);
      } else {
        setCurrentCode("");
      }
    } else {
      setCurrentCode("");
    }
  }, [selectedFile, fetchFileContent]);

  const handleEditorChange = useCallback((newCode) => {
    setCurrentCode(newCode);
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.path === selectedPath ? { ...file, content: newCode, hasUnsavedChanges: true } : file
      )
    );
  }, [selectedPath]);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/list");
      const { files: serverFiles } = await res.json();

      const formattedFiles = serverFiles.map(f => ({
        name: f.path.split('/').pop(),
        path: f.path,
        content: undefined, hasUnsavedChanges: false,
      }));

      setFiles(formattedFiles);

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
    } catch (err) {
      console.error("Error refreshing file list:", err);
			addToast(`Error refreshing file list: ${err.message}`, 'error');
    }
  }, [selectedPath, addToast]);

  const handleFiles = useCallback(async (browserFileList) => {
    if (!browserFileList || browserFileList.length === 0) return;

    const fd = new FormData();
    const processedFilesForState = [];

    for (const file of browserFileList) {
      const filePathInTree = file.webkitRelativePath || file.name;

      // Append the actual file content to FormData for upload.
      fd.append("files", file);

      // Explicitly append the full relative path as a separate field.
      fd.append("filePaths", filePathInTree);

      processedFilesForState.push({
        name: file.name,
        path: filePathInTree,
        _file: file, // Keep original file object to read content locally
        content: undefined,
        hasUnsavedChanges: false,
      });
    }

    try {
      addToast('Uploading files...', 'info');
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: fd,
      });

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${uploadRes.statusText}`);
      }

      addToast('Upload successful! Reading file contents...', 'success');

      // Read content of readable files locally to avoid re-fetching
      const readableFiles = processedFilesForState.filter(({ path }) => /\.(html?|css|js|txt)$/i.test(path));
      const filesWithContentPromises = readableFiles.map(async (item) => ({
        ...item,
        content: await item._file.text(),
      }));
      const filesWithContent = await Promise.all(filesWithContentPromises);

      const mergedFiles = processedFilesForState.map(item => {
        const found = filesWithContent.find(w => w.path === item.path);
        // clean up the _file object as it's not needed anymore
        const { _file, ...rest } = found || item;
        return rest;
      });

      setFiles(mergedFiles);

      // Auto-select the first readable file to show in the editor.
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
      addToast(`Upload Error: ${err.message}`, 'error');
    }
  }, [addToast, setFiles, setSelectedPath, setCurrentCode]);

  const handleSaveAll = useCallback(async () => {
    const unsavedFiles = files.filter(f => f.hasUnsavedChanges);
    if (unsavedFiles.length === 0) {
      addToast('No unsaved changes to save.', 'info');
      return;
    }

    try {
      const filesToSave = unsavedFiles.map(({ path, content }) => ({ path, content }));
      const response = await fetch('/api/save-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: filesToSave }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to save all: ${response.statusText}`);
      }

      setFiles(prevFiles =>
        prevFiles.map(file =>
          file.hasUnsavedChanges ? { ...file, hasUnsavedChanges: false } : file
        )
      );
      addToast(`${unsavedFiles.length} file(s) saved successfully!`, 'success');
    } catch (err) {
      console.error("Error saving all files:", err);
      addToast(`Error: ${err.message}`, 'error');
    }
  }, [files, addToast]);

  return { files, setFiles, selectedPath, setSelectedPath, currentCode, selectedFile, hasUnsavedChanges, handleEditorChange, refreshList, handleFiles, handleSaveAll };
}