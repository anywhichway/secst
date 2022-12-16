import textContent from "./text-content.js";

const sup = {
    contentAllowed:{...textContent}
}
delete sup.contentAllowed.sup;

export {sup,sup as default}