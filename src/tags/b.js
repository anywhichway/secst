import textContent from "./text-content.js";

const b = {
    contentAllowed:{...textContent}
}
delete b.contentAllowed.b;

export {b,b as default}