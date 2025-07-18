import { domTransform } from "..//hooks/domTransform.js";

// remove 'style' attribute from given elements
export function cleanElementAttributes() {
  return domTransform((document) => {
    const discardElemAttributes = (element, ...attributes) =>
      attributes.forEach((attribute) => element.removeAttribute(attribute));
    return document.querySelectorAll("body, div, span, bold, em").forEach((elem) =>
      discardElemAttributes(elem, "style")
    );
  });
}