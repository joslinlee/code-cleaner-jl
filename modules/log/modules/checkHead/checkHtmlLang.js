import { config, errorMessages } from '../../../../config.js';

export function checkHtmlLang(document, filePath, errors) {
  const fileErrors = [];
  // Check if the HTML element has a 'lang' attribute and if it's 'en'
  const html = document.documentElement; // Use documentElement for the <html> tag
  if (html.getAttribute(config.langSelector) !== config.langEnValue) {
    // The error is on the <html> tag, but it might be implicit.
    // Point to the first element in the body as a stable anchor with a location.
    // Use document.body and fallback to document.documentElement for robustness.
    const body = document.body;
    const nodeToReport = body?.firstElementChild || body?.firstChild || body || document.documentElement;
    fileErrors.push({
      message: errorMessages.missingLangAttributeErrorMessage,
      node: nodeToReport,
    });
  }

  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
