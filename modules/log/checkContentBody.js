export function checkContentBody(document, filePath, errors) {
  // Get all elements with the class 'content-body' from the document
  let contentBodies = Array.from(document.querySelectorAll('.content-body'));

  // Check each content body
  contentBodies.forEach(contentBody => {
    // Check if the content body is nested within another content body
    if (contentBody.querySelectorAll('.content-body').length > 0) {
      if (!errors[filePath]) {
        errors[filePath] = [];
      }
      errors[filePath].push("An invalid '.content-body' (nested within another '.content-body')");
    }

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
