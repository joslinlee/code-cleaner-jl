import { config, errorMessages } from "../../../../config.js";

export function checkScriptTagsLocation(document, filePath, errors) {
  const fileErrors = [];
  // Get all <script> elements in the document
  const scriptElements = document.querySelectorAll(config.scriptSelector);

  scriptElements.forEach((script) => {
    // A script tag's parent should be the <head> element.
    // If it has no parent, or its parent is not <head>, it's an error.
    // JSDOM may place scripts found outside <html> as siblings to it,
    // in which case parentElement will be null.
    if (!script.parentElement || script.parentElement.tagName.toLowerCase() !== config.headSelector) {
      fileErrors.push({
        message: errorMessages.invalidJsPlacementErrorMessage,
        node: script,
      });
    }
  });

  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
