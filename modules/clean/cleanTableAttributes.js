import { domTransform } from "..//hooks/domTransform.js";

// remove given attributes from table elements
export function cleanTableAttributes() {
  return domTransform((document) => {
    const discardTableAttributes = (tableElement, ...tableAttributes) =>
      tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
    return document.querySelectorAll("table, thead, tbody, tfoot, tr, th, td").forEach((tableElem) =>
      discardTableAttributes(tableElem, "cellspacing", "cellpadding", "width", "style")
    );
  });
}