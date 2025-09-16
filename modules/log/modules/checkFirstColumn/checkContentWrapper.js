import { config, errorMessages } from "../../../../config.js";

export function checkContentWrapper(document, filePath, errors) {
  const fileErrors = [];
  // Check if the document contains a div with the id 'content-wrapper'
  let contentWrapper = document.querySelector(config.contentWrapperSelector);
  // Check if document contains #first-column
  let firstColumn = document.querySelector(config.firstColumnSelector);
  // If neither contentWrapper nor firstColumn exists, it will log the error
  if (!contentWrapper && !firstColumn) {
    // This is a file-level error, so report it on line 1.
    fileErrors.push({
      message: errorMessages.missingContentWrappperFirstColumnErrorMessage,
      line: 1,
    });
  }

  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
