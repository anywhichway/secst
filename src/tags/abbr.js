import textContent from "./text-content.js";

const abbr = {
    contentAllowed:{...textContent}
}
delete abbr.contentAllowed.abbr;

export {abbr,abbr as default}