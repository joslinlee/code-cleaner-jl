import { config, errorMessages } from "../../../config.js";

export function checkIframes(document, filePath, errors) {
  const fileErrors = [];
  // Get all iframes from the document
  let iframes = Array.from(document.querySelectorAll(config.iframeSelector));

  // Check each iframe
  iframes.forEach(iframe => {
    const src = iframe.getAttribute(config.sourceSelector) || '';
    const ariaLabel = iframe.getAttribute("aria-label")?.toLowerCase() || '';
    const isPanopto = config.panoptoIframeSelector.some(url => src.includes(url)) || ariaLabel.includes("panopto");
    const isYouTube = config.youTubeUrlSelector.some(url => src.includes(url)) || ariaLabel.includes("youtube");

		let errorMessage = null;

    // Check 1: Panopto and YouTube iframes must have the standard media wrapper.
    if (isPanopto || isYouTube) {
      const parent = iframe.parentElement;
      const grandParent = parent ? parent.parentElement : null;

      const isCorrectlyWrapped = parent &&
        parent.tagName.toLowerCase() === config.divSelector &&
        parent.classList.contains(config.mediaObjectSelector) &&
        grandParent &&
        grandParent.tagName.toLowerCase() === config.divSelector &&
        grandParent.classList.contains(config.mediaContainerSelector);

      if (!isCorrectlyWrapped) {
        errorMessage = errorMessages.iframeWrapperErrorMessage;
      }
    } 
    // Check 2: All other iframes must have a simple div wrapper.
    else {
      const parent = iframe.parentElement;

			// Ensure the iframe is wrapped in a <div> that is NOT a content-body div.
      const hasDivWrapper = parent && parent.tagName.toLowerCase() === config.divSelector && !parent.classList.contains(config.contentBodyClassSelector);

			// If there is no valid div wrapper, log an error.
      if (!hasDivWrapper) {
        errorMessage = errorMessages.iframeDivErrorMessage;
      }
    }

		if (errorMessage) {
      fileErrors.push({
        message: errorMessage,
        node: iframe,
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