const forEach = {
    attributesAllowed:{
        "data-iterable": true,
        iterable(value) {
            if(typeof(value)==="string") {
                return {
                    "data-iterable": value
                }
            }
            return {
                "data-iterable": JSON.stringify(value)
            }
        }
    },
    async contentAllowed() {
       const {allTags} = await import("./all-tags.js");
       return this.contentAllowed = allTags;
    },
    async connected(el,node) {
        const parent = el.parentElement;
        let iterable = el.getAttribute("data-iterable");
        try {
            iterable = JSON5.parse(iterable);
        } catch(e) {
            let root = el.parentElement;
            while(root.parentElement) {
                root = root.parentElement;
            }
            const els = [...root.querySelectorAll(iterable)],
                requestor = el;
            iterable = await els.reduce(async (items,el) => {
                items = await items;
                const template = el.getAttribute("data-template");
                if(template) {
                    const value =  await SECST.resolveDataTemplate(root,template,el)
                    if(value!=null) {
                        items.push(value)
                    }
                } else {
                    try {
                        items.push(JSON5.parse(el.innerText))
                    } catch(e) {
                        items.push(el.innerText)
                    }
                }
                return items;
            },[])
        }
        iterable.forEach((item,index,iterable) => {
            // todo: move to web worker
            const html = (new Function("item","index","iterable","with(item) { return `" + el.innerHTML + "` }"))(item,index,iterable);
            el.insertAdjacentHTML("beforebegin",html)
        });
        el.remove()
    }
}
delete forEach.contentAllowed.forEach;

export {forEach,forEach as default}