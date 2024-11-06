import dom from "gulp-dom";

// remove given attributes from table elements
export function cleanTableAttributes() {
  return dom(function () {
    const discardTableAttributes = (tableElement, ...tableAttributes) =>
      tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
    return this.querySelectorAll("table, thead, tbody, tfoot, tr, th, td").forEach((tableElem) =>
      discardTableAttributes(tableElem, "cellspacing", "cellpadding", "width", "style")
    );
  });
}