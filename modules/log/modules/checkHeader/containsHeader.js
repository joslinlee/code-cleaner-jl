import { config, errorMessages } from "../../../../config.js";

export function containsHeader(document, filePath, errors) {
	const fileErrors = [];
	// Convert filePath to lowercase and check if it contains 'syllabus' and if it is the syllabus then skip it
	if (filePath.toLowerCase().includes(config.syllabusSelector)) {
		return;
	}

	// Check if the document contains a header with the class 'header'
	let header = document.querySelector(config.headerClassSelector);
	if (!header) {
		// If the header is missing, point to the start of the body's content.
		// If the body is empty, fall back to the body tag itself. This gives us
		// a better chance of finding a node with a valid source location.
		const body = document.querySelector("body");
		const nodeToReport = body.firstChild || body;
		// Add the error message to the errors array for the file path
		fileErrors.push({
			message: errorMessages.missingHeaderClassErrorMessage,
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