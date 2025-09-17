import { errorMessages } from '../../../../config.js';


export function checkNestedElements(contentBody, nestedElements, errors, filePath) {
  const fileErrors = [];
  nestedElements.forEach(nestedElement => {
    const invalidNestedElements = contentBody.querySelectorAll(nestedElement);
    invalidNestedElements.forEach((element) => {
      fileErrors.push({
        message: errorMessages.nestedContentBodyElement.replace('{nestedElement}', nestedElement),
        node: element,
      });
    });
  });

  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
