import { config, errorMessages } from "../../../../config.js";

export function checkDeprecatedId(document, filePath, errors) {
  const deprecatedIds = config.deprecatedClasses;
  const fileErrors = [];

  deprecatedIds.forEach(deprecatedId => {
    const element = document.getElementById(deprecatedId);
    if (element) {
      fileErrors.push({
        message: errorMessages.deprecatedIdErrorMessage.replace('{deprecatedId}', deprecatedId),
        node: element,
      });
    }
  });

  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
