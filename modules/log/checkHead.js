import { checkDoctype } from "./modules/checkHead/checkDoctype.js";
import { checkHtmlLang } from "./modules/checkHead/checkHtmlLang.js";
import { checkJquery } from "./modules/checkHead/checkJquery.js";

/**
 * Orchestrates all checks related to the <head> of the document.
 * @param {Document} document The JSDOM document object.
 * @param {string} filePath The absolute path to the file being checked.
 * @param {object} errors The object to which errors will be added.
 * @param {string} htmlContent The raw HTML content of the file.
 */
export function checkHead(document, filePath, errors, htmlContent) {
  checkDoctype(document, filePath, errors, htmlContent);
  checkHtmlLang(document, filePath, errors);
  checkJquery(document, filePath, errors);
}