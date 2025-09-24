import React from 'react';
import '../styles/LoadingBar.css';

const LoadingBar = ({ isLoading }) => {
  if (!isLoading) {
    return null;
  }

  return (
    <div className="loading-bar-container" role="progressbar" aria-label="Loading">
      <div className="loading-bar"></div>
    </div>
  );
};

export default LoadingBar;