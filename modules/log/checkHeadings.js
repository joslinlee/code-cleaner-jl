export function checkHeadings(document, filePath, errors) {
  // Get all content bodies
  const contentBodies = document.querySelectorAll('.content-body');

  // Loop over each content body separately, including an index for numbering
  contentBodies.forEach((contentBody, index) => {
    const contentBodyNumber = index + 1; // Start numbering from 1
    const headings = [];
    let h2Count = 0; // Counter for <h2> headings
    let previousLevel = 2; // Reset to h2 for each content body

    // Traverse the content body and collect headings
    const traverse = (node) => {
      if (node.tagName && /^h[1-6]$/.test(node.tagName.toLowerCase())) {
        const tag = node.tagName.toLowerCase();
        const level = parseInt(tag[1]); // Extract the level (e.g., 'h3' -> 3)
        headings.push({ tag, level, node });

        // Count <h2> tags
        if (level === 2) h2Count++;
      }

      // Recursively traverse child nodes
      for (let child of node.children) {
        traverse(child);
      }
    };

    traverse(contentBody); // Start traversing this content body

    // Initialize errors array for the file if it doesn't exist
    if (!errors[filePath]) errors[filePath] = [];

    // Check that the content body starts with <h2>
    if (headings.length === 0) {
      errors[filePath].push(`Content body #${contentBodyNumber}: Invalid heading structure (no heading found).`);
    } else if (headings[0].level !== 2) {
      errors[filePath].push(
        `Content body #${contentBodyNumber}: Invalid heading structure (expected <h2> at the beginning, but found <${headings[0].tag}>).`
      );
    }

    // Check for multiple <h2> tags in the same content body
    if (h2Count > 1) {
      errors[filePath].push(
        `Content body #${contentBodyNumber}: Invalid heading structure (only one <h2> is allowed, but found ${h2Count}).`
      );
    }

    // Validate heading structure within the current content body
    headings.forEach(({ level, tag }) => {
      if (level > previousLevel + 1) {
        errors[filePath].push(
          `Content body #${contentBodyNumber}: Invalid heading structure (<${tag}> found after <h${previousLevel}>).`
        );
      }
      previousLevel = level;
    });
  });
}
