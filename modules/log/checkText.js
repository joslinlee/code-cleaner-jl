import { checkHeadingSemantics } from './modules/checkText/checkHeadingSemantics.js';
import { checkTables } from './modules/checkText/checkTables.js';
import { checkTitleAndH1 } from './modules/checkText/checkTitleAndH1.js';
import { checkSingleH1 } from './modules/checkText/checkSingleH1.js';

export function checkText(document, filePath, errors) {
	checkHeadingSemantics(document, filePath, errors);
	checkTables(document, filePath, errors);
	checkTitleAndH1(document, filePath, errors);
	checkSingleH1(document, filePath, errors);
}
