const FileErrorGroup = ({ title, entries, isClickable, onPathClick }) => (
  <>
    <h3>{title}</h3>
    {entries.map(([filePath, errors]) => (
      <div key={filePath} className="report-file-section">
        <h4
          className={isClickable ? "report-file-path" : "report-file-path-non-clickable"}
          onClick={isClickable ? () => onPathClick(filePath) : undefined}
        >
          {filePath}
        </h4>
        <ul>
          {errors.map((error, index) => {
            const { message, line } = error;
            const canJumpToLine = isClickable && line;
            return (
              <li
                key={index}
                className={canJumpToLine ? "report-error-message" : ""}
                onClick={canJumpToLine ? () => onPathClick(filePath, line) : undefined}
                title={canJumpToLine ? `Click to jump to line ${line} in ${filePath}` : message}
              >
                {line ? `${message} (line ${line})` : message}
              </li>
            );
          })}
        </ul>
      </div>
    ))}
  </>
);

export default FileErrorGroup;