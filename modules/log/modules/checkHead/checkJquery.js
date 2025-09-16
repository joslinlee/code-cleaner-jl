import { config, errorMessages } from "../../../../config.js";

export function checkJquery(document, filePath, errors) {
	const fileErrors = [];
	// Check if the document contains the jquery script
	let jqueryScript = document.querySelector(config.jQueryScriptSelector);
	if (jqueryScript) {
		// Add the error message to the errors array for the file path
		fileErrors.push({
      message: errorMessages.missingJQueryScriptErrorMessage,
      node: jqueryScript, // The script tag itself is the perfect node.
    });
	}

	if (fileErrors.length > 0) {
		if (!errors[filePath]) {
			errors[filePath] = [];
		}
		errors[filePath].push(...fileErrors);
	}
}
