import React, { useEffect, useState } from 'react';

const ToastShowDuration = 2000; // Duration to show the toast before starting to close
const ToastCloseAnimationDuration = 400; // Duration of the close animation

const Toast = ({ toast, onClose }) => {
  const { id, message, type } = toast;
  const [isClosing, setIsClosing] = useState(false);

  // Start the closing process after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, ToastShowDuration); // Auto-close after 2 seconds

    return () => {
      clearTimeout(timer);
    };
  }, []); // Run only once when the toast mounts

  // When isClosing becomes true, wait for animation to finish, then remove from DOM
  useEffect(() => {
    if (isClosing) {
      // This duration should match the CSS animation duration
      const animationTimer = setTimeout(() => {
        onClose(id);
      }, ToastCloseAnimationDuration); 

      return () => {
        clearTimeout(animationTimer);
      };
    }
  }, [isClosing, id, onClose]);

  return (
    <div className={`toast ${type} ${isClosing ? 'fade-out' : ''}`}>
      <span className="toast-message">{message}</span>
      <button className="toast-close-btn" onClick={() => setIsClosing(true)}>
        &times;
      </button>
    </div>
  );
};

export default Toast;
