import { config, errorMessages } from "../../../config.js";

export function checkIframes(document, filePath, errors) {
  // Get all iframes from the document
  let iframes = Array.from(document.querySelectorAll(config.iframeSelector));

  // Check each iframe
  iframes.forEach(iframe => {
    const src = iframe.getAttribute(config.sourceSelector) || '';
    const ariaLabel = iframe.getAttribute("aria-label")?.toLowerCase() || '';

    const isH5P = config.h5pUrlSelector.some(url => src.includes(url));
    const isPanopto = config.panoptoIframeSelector.some(url => src.includes(url)) || ariaLabel.includes("panopto");

		let errorMessage = null;

    // Check 1: H5P iframes must have a personal <div> wrapper.
    // This check excludes Panopto videos, which are handled by `checkPanoptoContainer.js`.
    if (isH5P && !isPanopto) {
      const parent = iframe.parentElement;
      const isPersonallyWrapped = parent &&
        parent.tagName.toLowerCase() === config.divSelector &&
        parent.children.length === 1;

				if (!isPersonallyWrapped) {
					errorMessage = errorMessages.h5pIframeErrorMessage;
				}
    }
    // Check 2: All other iframes (e.g., YouTube) must have the standard media wrapper.
    // This is a catch-all that excludes H5P and Panopto iframes.
    else if (!isH5P && !isPanopto) {
      const parent = iframe.parentElement;
      const grandParent = parent ? parent.parentElement : null;

      // A correctly wrapped iframe should be in a .media-object div, which is in a .media-container div.
      const isCorrectlyWrapped = parent &&
        parent.tagName.toLowerCase() === config.divSelector &&
        parent.classList.contains(config.mediaObjectSelector) &&
        grandParent &&
        grandParent.tagName.toLowerCase() === config.divSelector &&
        grandParent.classList.contains(config.mediaContainerSelector);

				if (!isCorrectlyWrapped) {
					// Use the more descriptive error message for wrapper issues.
					errorMessage = errorMessages.iframeWrapperErrorMessage;
				}
    }

		if (errorMessage) {
      if (!errors[filePath]) {
        errors[filePath] = [];
      }
      errors[filePath].push(errorMessage);
    }
  });
}