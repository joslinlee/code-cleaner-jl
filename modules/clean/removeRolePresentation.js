import { domTransform } from "..//hooks/domTransform.js";

export function removeRolePresentation() {
  return domTransform((document) => {
    const elements = document.querySelectorAll('[role="presentation"]');
    elements.forEach((el) => el.removeAttribute("role"));
  });
}
