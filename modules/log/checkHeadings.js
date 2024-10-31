export function checkHeadings(document, filePath, errors) {
  const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
  let previousLevel = 0;
	let h1Count = 0;

	// Check if <h1> is present as the document title and <h2> follows
	if (!headings.length || headings[0].tagName !== "H1") {
		if (!errors[filePath]) {
			errors[filePath] = [];
		}
		errors[filePath].push(`Invalid heading structure (document must start with an <h1> heading).`);
	}

	// Loop through each heading and check for errors
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1]);

		// Check if there are more than two <h1> headings
		if(level === 1) {
			h1Count++;
			if(h1Count > 1) {
				if (!errors[filePath]) {
					errors[filePath] = [];
				}
				errors[filePath].push(`Invalid heading structure (more than one <h1> heading found).`);
			}
		}

    // Check if heading levels skip (e.g., <h2> followed directly by <h4>)
    if (level > previousLevel + 1 && previousLevel !== 0) {
			if (!errors[filePath]) {
        errors[filePath] = [];
      }
				errors[filePath].push(
					`Invalid heading structure (<${heading.tagName.toLowerCase()}> found after <h${previousLevel}>).`
				);
    }

    // Update previousLevel to current heading level
    previousLevel = level;
  });
}
