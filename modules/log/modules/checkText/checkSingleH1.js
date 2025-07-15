export function checkSingleH1(document, filePath, errors) {
	const h1Elements = document.querySelectorAll("h1");
	
	if(h1Elements.length > 1) {
		if (!errors[filePath]) {
			errors[filePath] = [];
		}
		errors[filePath].push(`Invalid heading structure (more than one <h1> heading found).`);
	}


}