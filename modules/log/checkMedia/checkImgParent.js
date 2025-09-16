import { config, errorMessages } from "../../../config.js";

export const checkImgParent = (document, filePath, errors) => {
	const fileErrors = [];
	const imgElements = document.querySelectorAll(config.imageSelector);

	if(imgElements.length > 0) {
		imgElements.forEach(img => {
			const imgParent = img.parentElement;
			if(imgParent) {
				if( imgParent.tagName === 'P') {
					fileErrors.push({
						message: errorMessages.paragraphWrapperErrorMessage,
						node: img,
					});
				}
			}
		})
	}

	if (fileErrors.length > 0) {
		if (!errors[filePath]) {
			errors[filePath] = [];
		}
		errors[filePath].push(...fileErrors);
	}
}