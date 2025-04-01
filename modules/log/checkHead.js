import { checkDoctype } from "./modules/checkHead/checkDoctype.js";
import { checkHtmlLang } from "./modules/checkHead/checkHtmlLang.js";
import { checkJquery } from "./modules/checkHead/checkJquery.js";

// Functions
export const checkHead = (document, filePath, errors) => {
	checkDoctype(document, filePath, errors);
	checkHtmlLang(document, filePath, errors);
	checkJquery(document, filePath, errors);
}