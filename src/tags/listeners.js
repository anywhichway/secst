const listeners = {
    listeners: {
        contentAllowed: true,
        transform(node) {
            node.tag = "script";
            node.content = [
                `[...document.querySelectorAll("${node.attributes.selector}")].forEach((el) => {
                    const listeners = { 
                        ${node.content.join("\n")}
                    };
                    Object.entries(listeners).forEach(([event,listener]) => {
                        el.addEventListener(event,listener);
                        if(event==="attributeChanged") {
                           secstObserver.observe(el,{attributes:true,attributeOldValue:true});
                        } else if(event==="disconnected") {
                           secstObserver.observe(el.parentElement,{childList:true});
                        }
                    });
                })`
            ]
            delete node.attributes.selector;
            return node;
        }
    }
}

export {listeners,listeners as default}