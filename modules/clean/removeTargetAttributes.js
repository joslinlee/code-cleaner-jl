import dom from "gulp-dom";

// remove 'target="_self"' and 'target="_new"' from any element that contains it
export function removeTargetAttributes() {
  return dom(function () {
    const discardTargetSelf = (element, ...attributes) =>
      attributes.forEach((attribute) => element.removeAttribute(attribute));
    return this.querySelectorAll('[target="_self"], [target="_new"]').forEach((tableElem) =>
      discardTargetSelf(tableElem, "target")
    );
  });
}