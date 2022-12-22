const forEntries = {
    attributesAllowed:{
        "data-object": true,
        object(value) {
            if(typeof(value)==="string") {
                return {
                    "data-object": value
                }
            }
            return {
                "data-object": JSON.stringify(value)
            }
        }
    },
    async contentAllowed() {
       const {allTags} = await import("./all-tags.js");
       return this.contentAllowed = allTags;
    },
    async connected(el,node) {
        const parent = el.parentElement;
        let object = el.getAttribute("data-object");
        try {
            object = JSON5.parse(object);
        } catch(e) {
            let root = el.parentElement;
            while(root.parentElement) {
                root = root.parentElement;
            }
            const target = root.querySelector(object),
                template = el.getAttribute("data-template");
            if(template) {
                object =  await SECST.resolveDataTemplate(root,template,el);
                if(object && typeof(object)==="string") {
                    try {
                        object = JSON5.parse(object)
                    } catch(e) {
                        object = {}
                    }
                }
            } else {
                try {
                   object = JSON5.parse(target.innerText)
                } catch(e) {
                   object = {}
                }
            }
        }
        Object.entries(object).forEach(([key,value],index,iterable) => {
            // todo: move to web worker
            const template = el.innerHTML.replaceAll(/&amp;/g,"&"); // should do a regexp replace inside string templates
            const html = (new Function("key","value","index","iterable","return `" + template + "`"))(key,value,index,iterable);
            el.insertAdjacentHTML("beforebegin",html)
        });
        el.remove()
    }
}
delete forEntries.contentAllowed.forEntries;

export {forEntries,forEntries as default}