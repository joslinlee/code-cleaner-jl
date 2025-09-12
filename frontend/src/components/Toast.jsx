import React, { useEffect, useState } from 'react';

const Toast = ({ toast, onClose }) => {
  const { id, message, type } = toast;
  const [isClosing, setIsClosing] = useState(false);

  // Start the closing process after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
    }, 1000); // Auto-close after 1 seconds

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
      }, 400); 

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
