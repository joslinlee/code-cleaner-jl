import { domTransform } from "..//hooks/domTransform.js";

export function cleanImageAttributes() {
	return domTransform((document) => {
    // Define the attributes to remove from each image tag
    const attributesToRemove = [
      "decoding",
      "fetchpriority",
      "height",
      "loading",
      "srcset",
      "style",
      "sizes",
      "width"
    ];

    // Select all <img> elements in the document
    const images = document.querySelectorAll("img");

    images.forEach((img) => {
      // Remove specified attributes from the <img> tag
      attributesToRemove.forEach(attr => img.removeAttribute(attr));

      // Ensure each <img> not in a <figure> with <figcaption> has an alt attribute
      const figure = img.closest("figure");
      const figcaption = figure ? figure.querySelector("figcaption") : null;
      if (!figcaption && !img.hasAttribute("alt")) {
        img.setAttribute("alt", "");
      }

      // Check if the parent is a <p> and replace it with a <div>
      const parent = img.parentNode;
      if (parent && parent.tagName.toLowerCase() === "p") {
        const div = document.createElement("div");
        parent.replaceWith(div);
        div.appendChild(img);
      }
    });
  });
}
