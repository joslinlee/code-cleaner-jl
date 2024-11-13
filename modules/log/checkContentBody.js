export function checkContentBody(document, filePath, errors) {

  // List of invalid nested elements
  const nestedElements = ['.content-body', 'header']; 
		// Add elements that should not be nested in a .content-body to the array above as needed
			// Prefix classes with '.' to add
			// Prefix IDs with '#' to add 
			// Do not prefix tags to add

  // Get all elements with the class 'content-body' from the document
  let contentBodies = Array.from(document.querySelectorAll('.content-body'));

  // Check each content body
  contentBodies.forEach(contentBody => {
    nestedElements.forEach(nestedElement => {
      // Check if the content body contains any invalid nested elements
			if (contentBody.querySelectorAll(nestedElement).length > 0) {
        if (!errors[filePath]) {
          errors[filePath] = [];
        }
        errors[filePath].push(`An invalid '${nestedElement}' is nested within a '.content-body'`);
      }
    });

    // Check if the content body is inside #content-wrapper, #second-column, or #third-column
    let parent = contentBody.parentElement;
    let isInside = false;
    while (parent !== null) {
      if (parent.tagName.toLowerCase() === 'div' && 
          (parent.getAttribute('id') === 'content-wrapper' || 
           parent.getAttribute('id') === 'second-column' || 
           parent.getAttribute('id') === 'third-column')) {
        isInside = true;
        break;
      }
      parent = parent.parentElement;
    }

    if (!isInside) {
      if (!errors[filePath]) {
        errors[filePath] = [];
      }
      errors[filePath].push("A 'content-body' is not inside #content-wrapper, #second-column, or #third-column");
    }
  });
}
