import dom from "gulp-dom";
import { config } from "../../config.js";

// Array of tags to remove, leaving content intact
const innerContentBodyTagsToRemove = config.innerContentBodyTagsToRemove;

export function removeContentBodyInnerTags() {
  return dom(function () {
    // Select all elements with the .content-body class
    const contentBodyElements = this.querySelectorAll('.content-body');
    
    // Loop through each .content-body element
    contentBodyElements.forEach(contentBody => {
      // For each tag to remove, find matching nested elements
      innerContentBodyTagsToRemove.forEach(tag => {

        // Select all elements within the .content-body that match the tag name
        contentBody.querySelectorAll(tag).forEach(element => {
          // Replace the element with its inner content, effectively removing the tag
          element.replaceWith(...element.childNodes);
        });
      });
    });
  });
}
