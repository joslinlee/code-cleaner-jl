// This requires a check for media container and media object even though it is found in checkIframeTitles.js because Panopto videos are lumped together with h5p videos in the same check. This is a separate check for Panopto videos only.

export function checkPanoptoWrapper(document, filePath, errors) {
	// Get all panopto videos from the document - this uses the "rcode=PIMA" parameter in the URL
	const panoptoVideos = Array.from(document.querySelectorAll('iframe[src*="rcode=PIMA"]'));

	// Check each panopto video
	panoptoVideos.forEach(panoptoVideo => {
		let mediaObject = panoptoVideo.parentElement;

		// Check if the iframe is contained within a div with the class 'media-object'
		if (mediaObject && mediaObject.tagName.toLowerCase() === 'div' && mediaObject.classList.contains('media-object')) {

			let mediaContainer = mediaObject.parentElement;

			// Check if the div with the class 'media-object' is contained within a div with the class 'media-container'
			if(mediaContainer && mediaContainer.tagName.toLowerCase() === 'div' && mediaContainer.classList.contains('media-container')) {
			} else {
				if (!errors[filePath]) {
					errors[filePath] = [];
				}
				// If the div with the class 'media-object' is not contained within a div with the class 'media-container', add an error
				errors[filePath].push('Invalid iframes detected (panopto iframe not wrapped by \'.media-container\' and/or \'.media-object\')');
			}
		} else {
			// No errors array for this file yet, create one
			if (!errors[filePath]) {
				errors[filePath] = [];
			}
			// If the iframe is not contained within a div with the class 'media-object', add an error
			errors[filePath].push('Invalid iframes detected (panopto iframe not not wrapped by \'.media-container\' and/or \'.media-object\')');
		}
	});
}