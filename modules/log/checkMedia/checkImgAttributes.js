import { config, errorMessages } from "../../../config.js";

export function checkImgAttributes(document, filePath, errors) {
  const fileErrors = [];

  // Helper function to log errors
  const logError = (message, node) => {
    fileErrors.push({ message, node });
  };

  // Get all <img> elements
  const imgElements = document.querySelectorAll(config.imageSelector);

  imgElements.forEach((img) => {
    // Check if alt attribute is missing
    if (!img.hasAttribute(config.altSelector)) {
      // Check if the <img> is within a <header>
      const isInHeader = img.closest(config.headerSelector) !== null;

      if (isInHeader) {
        // If in a <header>, log a specific error for a missing alt attribute only
        logError(errorMessages.headerAltTitleErrorMessage, img);
      } else {
        // If not in a <header>, check if the <img> is inside a <figure> with a <figcaption>
        const parent = img.parentElement;
        if (!parent || parent.tagName !== config.figureSelector.toUpperCase() || !parent.querySelector(config.figcaptionSelector)) {
          logError(errorMessages.nonFigureAltErrorMessage, img);
        } else {
          // <img> is inside a <figure> with a <figcaption> but missing alt attribute
          logError(errorMessages.figureAltTextErrorMesage, img);
        }
      }
    }

    // Check for unnecessary attributes
    const attributes = config.imageAttributesToRemove;
    attributes.forEach((attribute) => {
      if (img.hasAttribute(attribute)) {
        logError(errorMessages.unnecessaryAttributeErrorMessage.replace("{attribute}", attribute), img);
      }
    });
  });

  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
