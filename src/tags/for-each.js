import JSON5 from "json5";

const forEach = {
    attributesAllowed:{
        "data-iterable": true,
        iterable(value) {
            try {
                const iterable = JSON5.parse(value);
                if(Array.isArray(iterable)) {
                    return {
                        "data-iterable": value
                    }
                }
                throw new TypeError(`${value} is not iterable`)
            } catch(e) {
                throw e;
            }
        }
    },
    contentAllowed: "*",
    transform(node) {
        node.contents = [node.contents.join("")]
    },
    mounted(el,node) {
        const parent = el.parentElement,
            iterable = JSON5.parse(el.getAttribute("data-iterable")),
            template = node.contents[0];
        iterable.forEach((item,index,iterable) => {
            // todo: move to web worker
            const html = (new Function("item","index","iterable","with(item) { return `" + template + "` }"))(item,index,iterable);
            el.insertAdjacentHTML("beforebegin",html)
        });
        el.remove()
    }
}
delete forEach.contentAllowed.forEach;

export {forEach,forEach as default}