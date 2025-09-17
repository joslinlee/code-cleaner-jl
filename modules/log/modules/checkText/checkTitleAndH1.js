import { config, errorMessages } from '../../../../config.js';

export function checkTitleAndH1(document, filePath, errors) {
  const fileErrors = [];
  // Get the <title> and <h1> elements
  let title = document.querySelector(config.titleSelector);
  let h1 = document.querySelector(config.h1Selector);

  if (title && h1) {
    // Check if the text content of <title> and <h1> match
    if (title.textContent.trim() !== h1.textContent.trim()) {
      fileErrors.push({
        message: errorMessages.titleAndH1MismatchErrorMessage,
        node: h1, // The h1 tag is a good visual anchor for this error.
      });
    }
  } else if (!title) {
    // If there's no title, pointing to the <head> is a sensible location.
    const head = document.querySelector("head"); // jsdom always creates a head
    const nodeToReport = head.firstChild || head;
    fileErrors.push({
      message: errorMessages.missingTitleErrorMessage,
      node: nodeToReport,
    });
  }

  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
