import { checkNestedElements } from "./modules/checkContentBody/checkNestedElements.js";
import { checkValidParent } from "./modules/checkContentBody/checkValidParent.js";

export function checkContentBody(document, filePath, errors) {
  const nestedElements = [".content-body", "header"];
  const contentBodies = Array.from(document.querySelectorAll(".content-body"));
  const validParents = ["content-wrapper", "first-column", "second-column", "third-column"];

  if (!errors[filePath]) {
    errors[filePath] = [];
  }

  contentBodies.forEach(contentBody => {
    checkNestedElements(contentBody, nestedElements, errors, filePath);

    if (!checkValidParent(contentBody, validParents)) {
      errors[filePath].push("A 'content-body' is not inside #content-wrapper, #second-column, or #third-column");
    }
  });
}
