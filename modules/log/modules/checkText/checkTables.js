import { config, errorMessages } from '../../../../config.js';
const vertTableClasses = config.vertTableClasses;


export function checkTables(document, filePath, errors) {
  // A local array to gather errors for this file.
  const fileErrors = [];

  // Get all tables from the document
  let tables = document.querySelectorAll(config.tableSelector);

  // Check each table
  tables.forEach(table => {
    // Check if the table has the 'display-lg' class
    if (!table.classList.contains(config.displayLgClass)) {
			// Check if the table has any of the specified classes for vertical tables
			if(!vertTableClasses.some(className => table.classList.contains(className))) {
        // If the table does not have the 'display-lg' class or vertical table class, add an error
        fileErrors.push({
          message: errorMessages.displayLgClassErrorMessage,
          node: table,
        });
		  } 
    }

    // Check the structure of the table
    let thead = table.querySelector(config.theadSelector);
    if (thead) {
      let tr = thead.querySelector(config.trSelector);
      if (tr) {
        if (tr.querySelectorAll(config.scopeSelector).length === 0) {
          fileErrors.push({
            message: errorMessages.misssingScopeErrorMessage,
            node: tr,
          });
        }
      } else {
        fileErrors.push({
          message: errorMessages.missingTrErrorMessage,
          node: thead,
        });
      }
    } else if(vertTableClasses.some(className => table.classList.contains(className))) {
			// Check if the table has any of the specified classes for vertical tables, if not, then 
		} else {
      fileErrors.push({
        message: errorMessages.missingTheadErrorMessage,
        node: table,
      });
    }
  });

  // If any errors were found, add them to the main errors object.
  if (fileErrors.length > 0) {
    if (!errors[filePath]) {
      errors[filePath] = [];
    }
    errors[filePath].push(...fileErrors);
  }
}
