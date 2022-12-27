const title = {
    contentAllowed: true,
    connected(el) {
        el.ownerDocument.head.appendChild(el);
    }
}

export {title,title as default}