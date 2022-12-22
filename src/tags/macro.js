import Tag from "../tag.js";

const resolve = (variables,node,instanceContent) => {
    let attributes = {};
    if(!instanceContent) {
        attributes = Object.entries(node.attributes).reduce((attributes,[key,value]) => {
            if(typeof(value)==="string") {
                variables.forEach(([vname,vvalue]) => {
                    value = value.replaceAll(new RegExp(`\\$\\{${vname}\\}`,"g"),vvalue);
                });
            }
            attributes[key] = value;
            return attributes;
        },{})
    }
   const content = [...node.content,...(instanceContent||[])].map((node) => {
        if(typeof(node)==="string") {
            variables.forEach(([vname,vvalue]) => {
                node = node.replaceAll(new RegExp(`\\$\\{${vname}\\}`,"g"),vvalue);
            })
            return node;
        }
        return resolve(variables,node);
    })
    return new Tag({tag:node.tag,options:{attributes,id:node.id,classList:node.classList},content});
}

const macro = {
    transform(node) {
        macro.macros.set(node.attributes.name,{...node});
        node.attributes = {};
        node.content = [];
        return node;
    },
    mounted(el) {
        el.remove()
    },
    resolve(node,instance) {
        node.tag = node.attributes.tag;
        const attributes = {...node.attributes,...instance.attributes};
        return resolve(Object.entries(attributes),node,node.attributes.contentAllowed ? instance.content : null);
    }
}
macro.macros = new Map();

export {macro,macro as default}