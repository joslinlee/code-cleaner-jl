import { config, errorMessages } from '../../../../config.js';

export function checkDeprecatedClass(document, filePath, errors) {
  const deprecatedClasses = config.deprecatedClasses;
  const fileErrors = [];

  deprecatedClasses.forEach(deprecatedClass => {
    const elements = document.querySelectorAll(`.${deprecatedClass}`);
    elements.forEach(element => {
      fileErrors.push({
        message: errorMessages.deprecatedClassErrorMessage.replace('{deprecatedClass}', deprecatedClass),
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
