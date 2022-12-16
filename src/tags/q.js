import textContent from "./text-content.js";

const q = {
    contentAllowed:{...textContent}
}
delete q.contentAllowed.q;

export {q,q as default}