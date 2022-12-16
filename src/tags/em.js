import textContent from "./text-content.js";

const em = {
    contentAllowed:{...textContent}
}
delete em.contentAllowed.em;

export {em,em as default}