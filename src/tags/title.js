const title = {
    contentAllowed: true,
    mounted(el) {
        let root = el.parentNode;
        while(root.parentNode) {
            root = root.parentNode;
        }
        root.head.appendChild(el);
    }
}

export {title,title as default}