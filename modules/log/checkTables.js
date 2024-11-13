import { config } from '../../config.js';

const vertTableClasses = config.vertTableClasses;


export function checkTables(document, filePath, errors) {
  // Get all tables from the document
  let tables = document.querySelectorAll('table');

  // Check each table
  tables.forEach(table => {
    // Check if the table has the 'display-lg' class
    if (!table.classList.contains('display-lg')) {

			// Check if the table has any of the specified classes for vertical tables
			if(!vertTableClasses.some(className => table.classList.contains(className))) {

			// If the table does not have the 'display-lg' class or vertical table class, add an error
			if (!errors[filePath]) {
        errors[filePath] = [];
      }
      errors[filePath].push('A table does not contain \'.display-lg\'');
		} 
    }

    // Check the structure of the table
    let thead = table.querySelector('thead');
    if (thead) {
      let tr = thead.querySelector('tr');
      if (tr) {
        if (tr.querySelectorAll('th[scope=\'col\']').length === 0) {
          if (!errors[filePath]) {
            errors[filePath] = [];
          }
          errors[filePath].push('A table does not contain the correct structure (missing <th scope=\'col\'> within <thead>)');
        }
      } else {
        if (!errors[filePath]) {
          errors[filePath] = [];
        }
        errors[filePath].push('A table does not contain the correct structure (missing <tr> within <thead>)');
      }
    } else if(vertTableClasses.some(className => table.classList.contains(className))) {
			// Check if the table has any of the specified classes for vertical tables, if not, then 
		} else {
      if (!errors[filePath]) {
        errors[filePath] = [];
      }
      errors[filePath].push('A table does not contain the correct structure (missing <thead>)');
    }
  });
}
