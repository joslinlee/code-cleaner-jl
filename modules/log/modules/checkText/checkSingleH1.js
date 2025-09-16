import { config, errorMessages }	from "../../../../config.js";

export function checkSingleH1(document, filePath, errors) {
	const fileErrors = [];
	const h1Elements = document.querySelectorAll(config.h1Selector);
	
	if(h1Elements.length > 1) {
		// Report an error for each H1 after the first one.
		h1Elements.forEach((h1, index) => {
			if (index > 0) {
				fileErrors.push({
					message: errorMessages.multipleH1HeadingsErrorMessage,
					node: h1,
				});
			}
		});
	}

	if (fileErrors.length > 0) {
		if (!errors[filePath]) {
			errors[filePath] = [];
		}
		errors[filePath].push(...fileErrors);
	}
}