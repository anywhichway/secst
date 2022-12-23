import textContent from "./text-content.js";

const footer = {
    contentAllowed:{...textContent},
    mounted(el) {
        let root = el.parentNode;
        while(root.parentNode) {
            root = root.parentNode;
        }
        const footer = root.getElementById("secst-footer");
        while(footer.lastChild) footer.lastChild.remove();
        while(el.firstChild) footer.appendChild(el.firstChild);
        el.remove();
    }
}

export {footer,footer as default}