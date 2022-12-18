import textContent from "./text-content.js";

const italic = {
    contentAllowed:{...textContent}
}
delete italic.contentAllowed.italic;

export {italic,italic as default}