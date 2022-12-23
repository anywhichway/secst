import textContent from "./text-content.js";

const header = {
    contentAllowed:{...textContent},
    mounted(el) {
        let root = el.parentNode;
        while(root.parentNode) {
            root = root.parentNode;
        }
        const header = root.getElementById("secst-header");
        while(header.lastChild) header.lastChild.remove();
        while(el.firstChild) header.appendChild(el.firstChild);
        el.remove();
    }
}

export {header,header as default}