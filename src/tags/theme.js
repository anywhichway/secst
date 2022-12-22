import Tag from "../tag.js";
import link from "./link.js";
import style from "./style.js";

const theme = {
    contentAllowed:{
        style,
        link,
        class: {
            attributesAllowed: {
                name:"string"
            },
            contentAllowed: true
        }
    },
    transform(node) {
        let css = "";
        if(node.attributes.scope) {
            css += node.attributes.scope + " ";
            delete node.attributes.scope;
        }
        node.content = node.content.reduce((keep,node) => {
            if(node.tag==="class") {
                css += `.${node.attributes.name} { ${node.content.join(";")} } `
            } else if(typeof(node)==="string" || node.tag==="style" || node.tag==="link") {
                keep.push(node);
            } else{
                css += `${node.tag} { ${node.content.join(";")} } `
            }
            return keep;
        },[]);
        if(node.attributes.url) {
            node.content.push(new Tag({tag:"link",options:{attributes:{rel:"stylesheet",href:node.attributes.url}}}));
            delete node.attributes.url;
        }
        if(css.length>0) {
            node.content.push(new Tag({tag:"style",content:[css]}));
        }
        return node;
    },
    mounted(el) {
        while(el.lastChild) {
            el.parentElement.insertBefore(el.lastChild,el)
        }
        el.remove();
    }
}
delete theme.contentAllowed.theme;

export {theme,theme as default}