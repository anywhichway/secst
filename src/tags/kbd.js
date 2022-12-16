import textContent from "./text-content.js";

const kbd = {
    contentAllowed:{...textContent}
}
delete kbd.contentAllowed.kbd;

export {kbd,kbd as default}