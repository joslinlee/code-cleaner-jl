export function checkContentWrapper(document, filePath, errors) {
  // Check if the document contains a div with the id 'content-wrapper'
  let contentWrapper = document.querySelector('div#content-wrapper');
  let firstColumn = document.querySelector('div#first-column');
  if (!contentWrapper && !firstColumn) {
    // Initialize the errors array for the file path if it doesn't exist
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    // Add the error message to the errors array for the file path
    errors[filePath].push("Missing '#content-wrapper' or '#first-column'");
  }
}
