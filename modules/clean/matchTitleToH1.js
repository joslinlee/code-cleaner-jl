/**
 * @file Defines a Gulp transformation that ensures the content of the <title> tag
 * matches the content of the first <h1> tag on the page.
 */
import { domTransform } from "../hooks/domTransform.js";
import { config } from "../../config.js";

export function matchTitleToH1() {
return domTransform((document) => {
  const h1 = document.querySelector(config.h1Selector);
    const title = document.querySelector(config.titleSelector);
    if (h1 && title && title.textContent !== h1.textContent) {
      title.textContent = h1.textContent;
    }
})
}