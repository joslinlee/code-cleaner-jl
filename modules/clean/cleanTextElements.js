import { domTransform } from "..//hooks/domTransform.js";

export function cleanTextElements() {
	return domTransform((document) => {
		const discardTextAttributes = (textElement, ...attributes) =>
      attributes.forEach((attribute) => textElement.removeAttribute(attribute));
    return document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, ul, ol, li, dl, dt, dd").forEach((elem) =>
      discardTextAttributes(elem, "width", "style")
    );
	})
}