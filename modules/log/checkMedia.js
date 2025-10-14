import { checkIframeTitles } from "./checkMedia/checkIframeTitles.js";
import { checkIframes } from "./checkMedia/checkIframes.js";
import { checkImgAttributes } from "./checkMedia/checkImgAttributes.js";
import { checkImgParent } from "./checkMedia/checkImgParent.js";


export const checkMedia = (document, filePath, errors) => {
	checkIframeTitles(document, filePath, errors);
	checkIframes(document, filePath, errors);
	checkImgAttributes(document, filePath, errors);
	checkImgParent(document, filePath, errors);
}