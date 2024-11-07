import dom from "gulp-dom";

// remove 'style' attribute from given elements
export function cleanElementAttributes() {
  return dom(function () {
    const discardElemAttributes = (element, ...attributes) =>
      attributes.forEach((attribute) => element.removeAttribute(attribute));
    return this.querySelectorAll("body, div, span, bold, em").forEach((elem) =>
      discardElemAttributes(elem, "style")
    );
  });
}