export function checkIframeTitles(document, filePath, errors, stringsToCheck) {
  // Get all iframes from the document
  let iframes = Array.from(document.querySelectorAll("iframe"));
  stringsToCheck= ["YouTube video player"];

  // Check each iframe
  iframes.forEach(iframe => {
    let title = iframe.getAttribute("title");

    // Check if the iframe does not contain a title attribute
    if (!title) {
      if (!errors[filePath]) {
        errors[filePath] = [];
      }
      errors[filePath].push("Invalid iframes detected (missing title attribute.)");
    } else {
      // Check if the title contains any string given by the array
      stringsToCheck.forEach(str => {
        if (title.includes(str)) {
          if (!errors[filePath]) {
            errors[filePath] = [];
          }
          errors[filePath].push(`Invalid iframes detected (incorrect title attribute: "${str}".)`);
        }
      });
    }
  });
}
