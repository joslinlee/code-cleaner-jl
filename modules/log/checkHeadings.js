export function checkHeadings(document, filePath, errors) {
  // Get all content bodies
  const contentBodies = document.querySelectorAll('.content-body');

  // Loop over each content body separately
  contentBodies.forEach((contentBody) => {
    const headings = [];
    let previousLevel = 2; // Reset to h2 for each content body

    // Traverse the content body and collect headings
    const traverse = (node) => {
      if (node.tagName && /^h[1-6]$/.test(node.tagName.toLowerCase())) {
        const tag = node.tagName.toLowerCase();
        const level = parseInt(tag[1]); // Extract the level (e.g., 'h3' -> 3)
        headings.push({ tag, level, node });
      }

      // Recursively traverse child nodes
      for (let child of node.children) {
        traverse(child);
      }
    };

    traverse(contentBody); // Start traversing this content body

    // Validate heading structure within the current content body
    for (const { level, tag } of headings) {
      if (level > previousLevel + 1 || level < previousLevel - 1) {
        if (!errors[filePath]) errors[filePath] = [];
        errors[filePath].push(
          `Invalid heading structure: <${tag}> found after <h${previousLevel}> in content body.`
        );
      } else if (headings.length < 1) {
				if (!errors[filePath]) errors[filePath] = [];
        errors[filePath].push(
          `Invalid heading structure: no heading found in content body`
        );
			} else if (level == 1) {
				if (!errors[filePath]) errors[filePath] = [];
				errors[filePath].push(
					`Invalid heading structure: <h1> found in content body`
				);
			} 
      previousLevel = level;
    }
  });
}
