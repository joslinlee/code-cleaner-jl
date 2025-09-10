import { config, errorMessages } from "../../../config.js";

const titlesToCheck = config.titlesToCheck;
const iframesToExclude = config.iframesToExclude;

export function checkIframeTitles(document, filePath, errors) {
  // Get all iframes from the document
  let iframes = Array.from(document.querySelectorAll(config.iframeSelector));

  // Check each iframe
		iframes.forEach((iframe) => {
			const src = iframe.getAttribute(config.sourceSelector) || "";
			const aria = (iframe.getAttribute("aria-label") || "").trim().toLowerCase();
			const title = iframe.getAttribute(config.titleSelector);
	
			const isH5P =
				(src && src.startsWith(config.h5pUrlStarting)) ||
				(Array.isArray(config.h5pUrlSelector) &&
					config.h5pUrlSelector.some(url => src.includes(url)));
	
			const isPanopto =
				(Array.isArray(config.panoptoIframeSelector) &&
					config.panoptoIframeSelector.some(url => src.includes(url))) ||
				aria === "panopto embedded video player";
	
			if (isH5P || isPanopto) {
				return; // skip this iframe entirely
			}

    const parent = iframe.parentElement;
    let hasMediaInfoSibling = false;

    // Check for a media-info sibling to determine if the title check is necessary.
    if (parent && parent.classList.contains(config.mediaObjectSelector)) {
      const grandParent = parent.parentElement;
      if (grandParent && grandParent.classList.contains(config.mediaContainerSelector)) {
        // Check if 'media-container' has a sibling with the class 'media-info'
        const siblings = Array.from(grandParent.children);
        hasMediaInfoSibling = siblings.some(sibling => sibling.classList.contains(config.mediaInfoSelector));
      }
    }

    // If 'media-container' does not have a 'media-info' sibling, check the iframe's title attribute
    if (!hasMediaInfoSibling && title) {
      titlesToCheck.forEach(str => {
        // Exclude Youtube placeholder iframes from log since those have the default title attr
        if (!iframesToExclude.some(url => src && src.includes(url)) && title.includes(str)) {
          if (!errors[filePath]) {
            errors[filePath] = [];
          }
          errors[filePath].push(errorMessages.iframeTitleErrorMessage.replace("{str}", str));
        }
      });
    }
  });
}
