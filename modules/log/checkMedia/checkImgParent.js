export const checkImgParent = (document, filePath, errors) => {

	const imgElements = document.querySelectorAll('img');

	if(imgElements.length > 0) {
		imgElements.forEach(img => {

			const imgParent = img.parentElement;
			if(imgParent) {
				if( imgParent.tagName === 'P') {
					if (!errors[filePath]) {
						errors[filePath] = [];
					}
				errors[filePath].push("An <img> element is wrapped in a <p> tag.")
				}
			}
		})
	}
}