import dom from "gulp-dom";

// remove given attributes from text elements
export function cleanTextElements() {
  return dom(function () {
    const discardTextAttributes = (textElement, ...attributes) =>
      attributes.forEach((attribute) => textElement.removeAttribute(attribute));
    return this.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, li, dl, dt, dd").forEach((elem) =>
      discardTextAttributes(elem, "width", "style")
    );
  });
}