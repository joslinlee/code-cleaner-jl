import { config, errorMessages } from "../../../../config.js";

export function checkHeadingSemantics(document, filePath, errors) {
  const fileErrors = [];
  const headings = Array.from(document.querySelectorAll(config.headingSelectors));
  let previousLevel = 0;
	const h1Check = document.querySelector(config.h1Selector);

	// Check if <h1> is present as the document title and <h2> follows
	if (headings.length && h1Check && headings[0].tagName !== config.h1Selector.toUpperCase()) {
		fileErrors.push({
			message: errorMessages.missingH1ErrorMessage,
			node: headings[0],
		});
	} else if (!headings.length) {
		const body = document.querySelector("body");
		const nodeToReport = body.firstChild || body;
		fileErrors.push({
			message: errorMessages.noHeadingsFoundErrorMessage,
			node: nodeToReport,
		});
	} else if (headings.length && !h1Check) {
		fileErrors.push({
			message: errorMessages.noH1HeadingFoundErrorMessage,
			node: headings[0],
		});
	}

	// Loop through each heading and check for errors
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);

    // Check if heading levels skip (e.g., <h2> followed directly by <h4>)
    if (level > previousLevel + 1 && previousLevel !== 0) {
				fileErrors.push({
					message: `Invalid heading structure (<${heading.tagName.toLowerCase()}> found after <h${previousLevel}>).`,
					node: heading,
				});
    }

    // Update previousLevel to current heading level
    previousLevel = level;
  });

  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
