const title = {
    contentAllowed: true,
    connected(el) {
        document.head.appendChild(el);
    }
}

export {title,title as default}