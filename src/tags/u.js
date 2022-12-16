import textContent from "./text-content.js";

const u = {
    contentAllowed:{...textContent}
}
delete u.contentAllowed.u;

export {u,u as default}