export function checkTitleAndH1(document, filePath, errors) {
  // Get the <title> and <h1> elements
  let title = document.querySelector('title');
  let h1 = document.querySelector('h1');

  if (title && h1) {
    // Check if the text content of <title> and <h1> match
    if (title.textContent.trim() !== h1.textContent.trim()) {
      if (!errors[filePath]) {
        errors[filePath] = [];
      }
      errors[filePath].push('<title> and <h1> do not match');
    }
  } else {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push('Missing <title> or <h1> element');
  }
}
