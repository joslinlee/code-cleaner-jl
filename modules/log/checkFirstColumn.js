import { checkContentWrapper } from "./modules/checkFirstColumn/checkContentWrapper.js";

export function checkFirstColumn(document, filePath, errors) {
	if (!errors[filePath]) {
		errors[filePath] = [];
	}

	checkContentWrapper(document, filePath, errors);
}