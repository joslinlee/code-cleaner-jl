import { domTransform } from "..//hooks/domTransform.js";

export function removeTargetAttributes() {
  return domTransform((document) => {
    const elements = document.querySelectorAll('[target="_self"], [target="_new"]');
    elements.forEach((el) => el.removeAttribute("target"));
  });
}
