/**
 * @file Defines a Gulp transformation to remove deprecated or styling attributes
 * from table-related elements (<table>, <th>, <td>, etc.), such as
 * 'cellspacing', 'cellpadding', 'width', and 'style'.
 */
import { domTransform } from "../hooks/domTransform.js";
import { config } from "../../config.js";

export function cleanTableAttributes() {
  return domTransform((document) => {
    const discardTableAttributes = (tableElement, ...tableAttributes) =>
      tableAttributes.forEach((tableAttribute) => tableElement.removeAttribute(tableAttribute));
    return document.querySelectorAll(config.tableElementsSelector).forEach((tableElem) =>
      discardTableAttributes(tableElem, ...config.tableAttributesToRemove)
    );
  });
}