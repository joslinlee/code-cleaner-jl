import { config, errorMessages } from "../../../../config.js";

export function checkDoctype(document, filePath, errors, htmlContent) {
  const fileErrors = [];

  // Check if the document has a doctype and if it's HTML
  // Trim whitespace from the beginning of the file content.
  const trimmedHtml = htmlContent.trimStart();

  // Check if the content starts with a case-insensitive doctype declaration.
  if (!trimmedHtml.toLowerCase().startsWith("<!doctype html>")) {
    // If the doctype is missing, report the error on line 1.
    fileErrors.push({
			message: errorMessages.missingDoctypeErrorMessage,
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
