import { domTransform } from "..//hooks/domTransform.js";

export function matchTitleToH1() {
return domTransform((document) => {
  const h1 = document.querySelector("h1");
    const title = document.querySelector("title");
    if (h1 && title && title.textContent !== h1.textContent) {
      title.textContent = h1.textContent;
    }
})
}