import dom from "gulp-dom";

// remove the 'role' attribute from any element that contains it
export function removeRolePresentation() {
  return dom(function () {
    const discardRolePres = (element, ...attributes) =>
      attributes.forEach((attribute) => element.removeAttribute(attribute));
    return this.querySelectorAll('[role="presentation"]').forEach((tableElem) =>
      discardRolePres(tableElem, "role")
    );
  });
}