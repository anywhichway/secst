import textContent from "./text-content.js";

const bold = {
    contentAllowed:{...textContent}
}
delete bold.contentAllowed.bold;

export {bold,bold as default}