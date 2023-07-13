export function checkImgAlt(document, filePath, errors) {
  // Get all <img> elements
  let imgElements = document.querySelectorAll('img');

  imgElements.forEach((img) => {
    if (!img.hasAttribute('alt')) {
      if (!errors[filePath]) {
        errors[filePath] = [];
      }
      errors[filePath].push('An <img> element is missing its alt attribute');
    }
  });
}
