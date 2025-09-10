// components/UploadModal.jsx
import { useRef, useState } from "react";

/**
 * A modal component for uploading files and folders.
 * It supports both drag-and-drop and a file selection button.
 * @param {object} props
 * @param {function} props.onClose - Callback function to be called when the modal is closed.
 *                                   It receives the selected FileList or null if no files were selected.
 */
export default function UploadModal({ onClose }) {
  // Create a ref to get direct access to the hidden file input element.
  // This allows us to programmatically trigger a click on it.
  const fileInputRef = useRef();

  // State to track if a file is being dragged over the modal.
  // This is used to apply a 'dragging' CSS class for visual feedback.
  const [isDragging, setIsDragging] = useState(false);

  /**
   * Handles the file selection when the user uses the file input dialog.
   * This is triggered by the `onChange` event of the hidden <input> element.
   * @param {React.ChangeEvent<HTMLInputElement>} selectEvent - The change event object.
   */
  const handleFileSelect = async (selectEvent) => {
    const selectedFiles = selectEvent.target.files; // The FileList object from the input.
    if (selectedFiles?.length) {
      onClose(selectedFiles); // Pass the FileList to the parent component.
    } else {
      onClose(null); // Indicate that no files were selected.
    }
  };

  /**
   * Handles the drop event when files are dragged onto the modal.
   * @param {React.DragEvent<HTMLDivElement>} dropEvent - The drag event object.
   */
  const handleDrop = async (dropEvent) => {
    dropEvent.preventDefault(); // Prevent the browser's default behavior (opening the file).
    dropEvent.stopPropagation(); // Stop the event from bubbling up.
    setIsDragging(false); // Reset the dragging state.

    const droppedFiles = dropEvent.dataTransfer.files; // Get the FileList from the drop event.
    if (droppedFiles?.length) {
      onClose(droppedFiles); // Pass the FileList to the parent component.
    } else {
      onClose(null);
    }
  };

  /**
   * Handles the drag-over event. Sets the dragging state to true.
   * @param {React.DragEvent<HTMLDivElement>} dragOverEvent - The drag event object.
   */
  const handleDragOver = (dragOverEvent) => {
    dragOverEvent.preventDefault(); // Necessary to allow a drop.
    dragOverEvent.stopPropagation();
    setIsDragging(true); // Set dragging state for visual feedback.
  };

  /**
   * Handles the drag-leave event. Resets the dragging state to false.
   * @param {React.DragEvent<HTMLDivElement>} dragLeaveEvent - The drag event object.
   */
  const handleDragLeave = (dragLeaveEvent) => {
    dragLeaveEvent.preventDefault();
    dragLeaveEvent.stopPropagation();
    setIsDragging(false); // Reset dragging state.
  };

  return (
    // The modal overlay, which closes the modal when clicked.
    <div className="upload-modal-overlay" onClick={() => onClose(null)}>
      {/* The modal content itself. */}
      <div
        className={`upload-modal ${isDragging ? "dragging" : ""}`}
        onClick={(clickEvent) => clickEvent.stopPropagation()} // Prevents clicks inside the modal from closing it.
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <h2>Upload Files or Folder</h2>
        <p>Drag & drop here, or use the button below</p>
        {/* This button triggers the hidden file input when clicked. */}
        <button onClick={() => fileInputRef.current.click()}>
          Select Files / Folder
        </button>
        {/* The actual file input, hidden from view. */}
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          multiple
          webkitdirectory="true" // Crucial for folder uploads
          directory="true"      // For broader compatibility
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}