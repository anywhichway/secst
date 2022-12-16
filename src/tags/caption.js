import textContent from "./text-content.js";

const caption = {
    contentAllowed:{...textContent}
}
delete caption.contentAllowed.caption;

export {caption,caption as default}