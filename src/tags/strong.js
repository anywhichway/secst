import textContent from "./text-content.js";

const strong = {
    contentAllowed:{...textContent}
}
delete strong.contentAllowed.strong;

export {strong,strong as default}