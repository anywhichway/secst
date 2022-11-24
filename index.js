/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 694:
/***/ ((module, __unused_webpack___webpack_exports__, __webpack_require__) => {


;// CONCATENATED MODULE: ./src/tags.js
const universalAttributes = {
        hidden: true,
        dir: {
            validate(value) {
                if(["ltr","rtl","auto"].includes(value)) {
                    return true;
                }
                throw new TypeError(`${value} is not a valid text directionality`)
            }
        },
        inert: true,
        is: true,
        title: true
    },
    blockContent = ["article","audio","blockquote","code","dl","figure","hr","img","listeners","ol","p","picture","script","style","table","ul","video","latex","math-science-formula"],
    simpleContent = ["a","abbr","bdi","bdo","br","del","i","ins","kbd","strong","sub","sup","time","var","wbr","underline","#","@linkedin"],
    structuredContent = ["address","aside","bdi","cite","code","details","input","output","value"],
    inlineContent = [...simpleContent,...structuredContent];

    for(let i=1;i<=8;i++) {
        blockContent.push("h"+i)
    }

    const tags = {
        "@linkedin": {
            attributesAllowed: {
                href: true
            },
            contentAllowed: true,
            transform(node) {
                node.tag = "a";
                node.options.attributes.href = `https://linkedin.com/${node.content[0].trim()}`
            }
        },
        "#": {
            contentAllowed: true,
            transform(node) {
                node.tag = "a";
                const hash = node.content[0].trim();
                node.options.id = hash;
                node.content = ["#"+hash];
            }
        },
        "math-science-formula": {
            contentAllowed: true
        },
        a: {
            attributesAllowed: {
                href: {
                    validate(value) {
                        try {
                            new URL(value);
                            return true;
                        } catch {
                            throw new TypeError(`${value} is not a valid URL for href`)
                        }
                    }
                },
                ping: {
                    validate(value) {
                        const urls = value.split(" ");
                        urls.forEach((url) => {
                            try {
                                new URL(url);
                            } catch {
                                throw new TypeError(`${url} is not a valid url for ping`)
                            }
                        });
                        return true;
                    }
                },
                referrerpolicy: {
                    validate(value) {
                        const policies = ["no-referrer","no-referrer-when-downgrade","origin","origin-when-cross-origin","same-origin",
                            "strict-origin","strict-origin-when-cross-origin"];
                        if(policies.includes(value)) {
                            return true;
                        }
                        throw new TypeError(`referrer policy ${value} is not one of ${JSON.stringify(policies)}`)
                    }
                },
                type: {
                    validate(value) {
                        const parts = value.split("/");
                        if(parts.length!==2 || parts[0].length<1 || parts[1].length<1) {
                            throw new TypeError(`${value} is not a valid MIME type`)
                        }
                        return true;
                    }
                }
            },
            contentAllowed: [...simpleContent]
        },
        article: {
            contentAllowed: [...blockContent,...inlineContent]
        },
        audio: {
            attributesAllowed: {
                src: true,
                controls: true
            },
            contentAllowed: ["source","track"]
        },
        bdo: {
            attributesAllowed: {
                dir: {
                    validate(value) {
                        return ["ltr","rtl"].includes(value)
                    }
                }
            }
        },
        blockquote: {
            allowAsRoot: true,
            contentAllowed: inlineContent,
            attributesAllowed: {
                cite: {
                    validate(value) {
                        new URL(value);
                        return true;
                    }
                }
            }
        },
        br: {

        },
        caption: {
            parentRequired: ["figure","table"],
            contentAllowed: simpleContent,
            transform(node,parent) {
                // if parent .tag = table, ensure it is first
                // if parent .tag = fig, change to fig caption
            }
        },
        code: {
            attributesAllowed: {
                language: true, // todo validate with list
                run: true
            },
            contentAllowed: true,
            transform(node) {
                const language = node.options.attributes.language,
                    run = node.options.attributes.run;
                if(run!=null && language==="latex") {
                    node.tag = "math-science-formula";
                    node.content = [node.content.join("\n")]
                }
                delete  node.options.attributes.language;
                delete node.options.attributes.run;
            }
        },
        dl: {
            contentAllowed: ["dt"]
        },
        dt: {
            contentAllowed: simpleContent
        },
        figure: {
            contentAllowed:[...blockContent,...inlineContent,"caption"].filter((item) => item!=="figure")
        },
        hr: {
            allowAsRoot: true
        },
        input: {
            attributesAllowed: {
                "data-autosize": true,
                "data-default": true,
                "data-extract": true,
                "data-template": true,
                "data-format": true,
                default(value) {
                    return {
                        "data-default": value
                    }
                },
                disabled: true,
                template(value) {
                    return {
                        "data-template": value
                    }
                },
                title: {
                    required: true
                },
                type: true,
                value:true
            }
        },
        img: {
            allowAsRoot: true,
            attributesAllowed: {
                alt:true,
                url(value) {
                    return {
                        src: value
                    }
                }
            },
            transform(node) {
                if (node.content[0]) {
                    node.options.attributes.title ||= node.content[0];
                    node.options.attributes.alt ||= node.content[0];
                    node.content.shift();
                }
            }
        },
        li: {
            breakOnNewline: true,
            attributesAllowed: {
                value: {
                    validate(value) {
                        if (parseInt(value) == value) return true;
                        return "a number"
                    }
                },
                type: {
                    validate(value) {
                        if ("aAiI1".includes(value) && value.length === 1) return true;
                        return "one of 'aAiI1`"
                    }
                }
            },
            contentAllowed: ["ol","ul",...inlineContent.filter((item) => item!=="li")],
            listeners: {
                click() {
                    alert("ok")
                }
            }
        },
        listeners: {
            allowAsRoot: true,
            contentAllowed: true,
            transform(node) {
                node.tag = "script";
                node.content = [
                    `[...document.querySelectorAll("${node.options.attributes.selector}")].forEach((el) => {
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
                delete node.options.attributes.selector;
            }
        },
        ol: {
            indirectChildAllowed: true,
            allowAsRoot: true,
            attributesAllowed: {
                reversed: true,
                start: {
                    validate(value) {
                        if (parseInt(value) == value) return true;
                        return "a number"
                    }
                },
                type: {
                    validate(value) {
                        if ("aAiI1".includes(value) && value.length === 1) return true;
                        return "one of 'aAiI1`"
                    }
                }
            },
            contentAllowed: ["li"],
            transform(node) {
                node.content = node.content.reduce((content,item) => {
                    if(typeof(item)==="string") {
                        const lines = item.split("\n");
                        let listitem = "";
                        lines.forEach((line,i) => {
                            line = line.trim();
                            const num = parseInt(line),
                                nl = i<lines.length-1 ? "\n" : "";
                            if(typeof(num)==="number" && !isNaN(num)) {
                                line = line.substring((num+".").length);
                                if(num!==1 && node.options.attributes.start==null) {
                                    node.options.attributes.start = num;
                                }
                                if(listitem.length>0) {
                                    content.push({tag:"li",content:[listitem]});
                                    listitem = line + nl;
                                } else {
                                    listitem += line + nl;
                                }
                            } else if(line.startsWith("- ")) {
                                line = line.substring(2);
                                if(listitem.length>0) {
                                    content.push({tag:"li",content:[listitem]});
                                    listitem = line + nl;
                                } else {
                                    listitem += line + nl;
                                }
                            } else {
                                listitem += line + nl;
                            }
                        })
                        if(listitem.length>0) {
                            content.push({tag:"li",content:[listitem]});
                        }
                    } else {
                        content.push(item);
                    }
                    return content;
                },[])
            }
        },
        p: {
            allowAsRoot: true,
            breakOnNewline: true,
            contentAllowed: [...inlineContent],
            attributesAllowed: {
                align: {
                    mapStyle: "text-align"
                }
            }
        },
        picture: {
            contentAllowed: ["img","source"]
        },
        script: {
            allowAsRoot: true,
            contentAllowed: true
        },
        source: {
            attributesAllowed: {
                type:true,
                height: {
                    validate(value) {
                        return parseInt(value)===value+"";
                        /*
                        Allowed if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                         */
                    }
                },
                media: {
                    validate(value) {
                        return true;
                        /*
                        Allowed if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                         */
                    }
                },
                sizes: {
                    validate(value) {
                        return true;
                        /*
                        Allowed if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                         */
                    }
                },
                src: {
                    validate(value) {
                        return true;
                        /*
                        Required if the source element's parent is an <audio> and <video> element, but not allowed if the source element's parent is a <picture> element.
                         */
                    }
                },
                srcset: {
                    validate(value) {
                        return true;
                        /*
                        Required if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                         */
                    }
                },
                width: {
                    validate(value) {
                        return parseInt(value)===value+"";
                        /*
                        Allowed if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                         */
                    }
                }
            },
            parentRequired: ["audio","picture","video"]
        },
        style: {
            allowAsRoot: true,
            contentAllowed: true,
            transform(node) {
                if(node.options.attributes.selector) {
                    node.content = [`${node.options.attributes.selector} { ${node.content.join(";")} }`]
                    delete node.options.attributes.selector;
                } else if(node.id) {
                    node.content = [`#${node.id} { ${node.content.join(";")} }`]
                    delete node.id;
                } else {
                    node.content = [node.content.join(";")]
                }
            }
        },
        table: {
            contentAllowed:["thead","tbody","tfoot","caption","tr"]
        },
        td: {
            attributesAllowed: {
                colspan: {
                    validate(value) {
                        return parseInt(value)===value+"";
                    }
                }
            },
            contentAllowed: inlineContent
        },
        th: {
            attributesAllowed: {
                colspan: {
                    validate(value) {
                        return parseInt(value)===value+"";
                    }
                }
            },
            contentAllowed: simpleContent
        },
        tr: {
            attributesAllowed: {
                rowspan: {
                    validate(value) {
                        return parseInt(value)===value+"";
                    }
                }
            },
            contentAllowed: ["td","th"]
        },
        track: {
          parentRequired: ["audio","video"],
          attributesAllowed: {
              default: {
                  validate(value,node) {
                      return true;
                      /*
                      This may only be used on one track element per media element.
                       */
                  }
              },
              kind: {
                  validate(value) {
                      return true;
                  }
              },
              label: true,
              src: {
                  validate(value) {
                      new URL(value);
                      /*
                      This attribute must be specified and its URL value must have the same origin as the document — unless the <audio> or <video> parent element of the track element has a crossorigin attribute.
                       */
                  }
              },
              srclang: {
                  validate(value) {
                      return true;
                  }
              }
          }
        },
        ul: {
            allowAsRoot: true,
            indirectChildAllowed: true,
            contentAllowed: ["li"]
        },
        underline: {
            attributesAllowed: {
                style: true
            },
            contentAllowed: inlineContent,
            styleAllowed() { return {"text-decoration":"underline"}},
            transform(node) {
                node.options.attributes.style =  {"text-decoration":"underline"};
            }
        },
        value: {
            allowAsRoot: true,
            attributesAllowed: {
                "data-autosize": true,
                "data-default": true,
                "data-extract": true,
                "data-format": true,
                "data-template": true,
                autosize() {
                    return {
                        "data-autosize": ""
                    }
                },
                default(value) {
                    return {
                        "data-default": value
                    }
                },
                disabled() {
                    return {
                        disabled: ""
                    }
                },
                extract(value) {
                    return {
                        "data-extract": value
                    }
                },
                format(value) {
                  return {
                      "data-format": value
                  }
                },
                readonly() {
                    return {
                        readonly: ""
                    }
                },
                static: true,
                template(value) {
                    return {
                        "data-template": value
                    }
                },
                title: {
                    required: true
                },
                type: {
                    default: "text",
                    transform(value,node) {
                        if(value==="currency-usd") {
                            node.options.attributes["data-format"] = "$${value}";
                            node.options.attributes["data-extract"] = "\\$([\\d.]*)";
                            return {
                                type: "text"
                            }
                        }
                        if(value==="boolean") {
                            return {
                                type: "checkbox"
                            }
                        }
                    },
                    validate(value, node) {
                        return ["checkbox","color","date","datetime-local","email","file",
                            "hidden","month","number","password","radio","range","tel","text",
                            "time","url","week","currency-usd","boolean"].includes(value)
                    }
                },
                value: true
            },
            async transform(node) {
                node.tag = "input";
                node.options ||= {};
                node.options.attributes ||= {};
                node.options.attributes.hidden = "";
                if (node.options.attributes.visible == "") {
                    delete node.options.attributes.hidden;
                    delete node.options.attributes.visible;
                }
                if (node.options.attributes["data-default"] == null) {
                    node.options.attributes["data-default"] = "";
                }
                if(node.options.attributes.src) {
                    if(node.options.attributes.static!=null) {
                        delete node.options.attributes.static;
                        const response = await fetch(node.options.attributes.src);
                        node.options.attributes.value = await response.text();
                    } else {
                        const f = `await (async () => { 
                            const response = await fetch("${node.options.attributes.src}");
                            return await response.text();
                            })()`;
                        node.options.attributes["data-template"] = f;
                    }
                    delete node.options.attributes.src;
                } else {
                    node.options.attributes["data-template"] = node.content.join("").trim();
                    node.options.attributes.value = node.options.attributes["data-default"]
                }
                node.content = [];
                return node;
            }
        },
        video: {
            attributesAllowed: {
                src: true,
                controls: true
            },
            contentAllowed: ["source","track"]
        }
    };

for(let i=1;i<=8;i++) {
    tags["h"+i] = {
        contentAllowed: simpleContent
    }
}

inlineContent.forEach((tag) => {
    if(!tags[tag]) {
        tags[tag] = {
            contentAllowed: inlineContent.filter((item) => item!==tag)
        }
    }
})
Object.entries(tags).forEach(([key,value]) => {
    value.tag = key;
    value.allowAsRoot ||= blockContent.includes(key);
})





;// CONCATENATED MODULE: ./src/index.js
/* module decorator */ module = __webpack_require__.hmd(module);
const replaceAsync = src_require("string-replace-async");


var src_require;
if(typeof(window)==="object") {
    src_require = () => {};
}
const jsdom = src_require('jsdom').jsdom;
if(typeof(jsdom)==="function") {
    global.document = jsdom('');
}

const extractValue = (el) => {
    const extract = el.getAttribute("data-extract");
    if(extract) {
        const match = [...el.value.matchAll(new RegExp(extract,"g"))][0];
        if(match) {
            return match[1];
        }
    }
    return el.value;
}
const formatValue = (el) => {
    const template = el.getAttribute("data-format");
    if(template) {
        return (new Function("value","return `" + template + "`"))(el.rawValue)
    }
    return el.rawValue;
};

const patchTopLevel = (tree) => {
    let previous;
    return tree.reduce((result,node) => {
        if(typeof(node)==="string") {
            const paragraphs = node.split("\n\n");
            paragraphs.forEach((paragraph,i) => {
                if(i===0 && previous) {
                    previous.content.push(paragraph);
                } else {
                    previous = {tag:"p",content:[paragraph]};
                    result.push(previous)
                }
            })
        } else if(previous && !tags[node.tag]?.allowAsRoot) {
            previous.content.push(node);
        } else {
            previous = null;
            result.push(node);
        }
        return result;
    },[]);
}

const validateNode = async ({node,path=[],errors=[]}) => {
    if(!node || typeof(node)!=="object") {
        return;
    }
    const tag = node.tag;
    let config = tags[node.tag];
    if(!config) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`Dropping unknown tag ${tag}`,null,null,node.location));
        return errors;
    }
    if(path.length===0 && !config.allowAsRoot) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`${tag} is not permitted as a root level element`,null,null,node.location));
        return errors;
    }
    if(config.parentRequired && (path.length==0 || !config.parentRequired.includes(path[path.length-1].tag))) {
        node.drop = true;
        errors.push(new parser.SyntaxError(`${tag} required parent to be one of`,JSON.stringify(config.parentRequired),path[path.length-1].tag,node.location));
        return errors;
    }

    let ancestorIndex;
    if(path.length>0 && !config.indirectChildAllowed && Array.isArray(config.contentAllowed) && !config.contentAllowed.includes(tag) && (ancestorIndex = path.findIndex((ancestor) => ancestor.tag===tag)!==-1)) {
        node.drop = true;
        const ancestor = path[ancestorIndex+1];
        ancestor.content.splice(ancestor.content.findIndex((node) => node.tag===tag),1,...node.content);
        errors.push(new parser.SyntaxError(`${tag} is not permitted as a nested element of self. Elevating content.`,null,null,node.location));
    }

    node.options ||= {};
    node.options.attributes ||= {};

    if(config.transform) {
        await config.transform(node);
    }
    if(node.content.length>0 && !config.contentAllowed) {
        while(node.content.length) { // try remove whitespace
            const item = node.content[0];
            if(typeof(item)!=="string" || item.trim().length!==0) {
                break;
            }
            node.content.shift();
        }
        if(node.content.length>0) {
            errors.push(new parser.SyntaxError(`${tag} is not permitted to have any content. Dropping content.`,null,JSON.stringify(node.content),node.location));
            node.content = [];
        }
    }
    node.content = await node.content.reduce(async (content,child) => {
        content = await content;
        const type = typeof(child);
        if(type==="string") {
            if(config.contentAllowed) {
                content.push(child);
                return content;
            }
            errors.push(new parser.SyntaxError(`${tag} does not allow string child. Dropping child.`,null,null,node.location))
        }
        if(child && type==="object") {
            if(!config.contentAllowed.includes(child.tag)) {
                errors.push(new parser.SyntaxError(`${tag} does not allow child ${child.tag}. Dropping child.`,null,null,node.location))
            } else {
                await validateNode({node:child,path:[...path,node],errors})
                if(!child.drop)  {
                    content.push(child);
                    // elevate trailing space to parent
                    if(child.content[child.content.length-1]===" ") {
                        content.push(child.content.pop());
                    }
                }
            }
            return content;
        }
        errors.push(new parser.SyntaxError(`${tag} has unexpected child type ${type} ${child}. Dropping child.`,null,null,node.location));
        return content;
    },[]);
    config.attributesAllowed ||= {};
    Object.entries(node.options?.attributes||{}).forEach(([key,value]) => {
        const attributeAllowed = universalAttributes[key] || config.attributesAllowed[key],
            type = typeof(attributeAllowed);
        if(type==="function") {
            const result = attributeAllowed(value,node);
            delete node.options.attributes[key];
            if(result) {
                Object.assign(node.options.attributes,result);
            }

        } else if(attributeAllowed && type==="object") {
            if(attributeAllowed.transform) {
                const result = attributeAllowed.transform(value,node);
                delete node.options.attributes[key];
                if(result) {
                    Object.assign(node.options.attributes,result);
                }
            }
            if(attributeAllowed.default && node.options?.attributes[key] == null) {
                node.options.attributes[key] = attributeAllowed.default;
            }
            if (attributeAllowed.required && node.options?.attributes[key] == null) {
                errors.push(new parser.SyntaxError(`${tag} is required to have attribute '${key}'`,null,null,node.location));
                return;
            }
            if(attributeAllowed.validate) {
                let valid;
                try {
                    valid = attributeAllowed.validate(value,node);
                } catch(e) {
                    valid = e+"";
                }
                if(valid!==true) {
                    delete node.options.attributes[key];
                    errors.push(new parser.SyntaxError(`${tag} the value of attribute '${key}' is invalid`,valid,value,node.location));
                }
            }
        } else if(attributeAllowed!==true) {
            delete node.options.attributes[key];
            errors.push(new parser.SyntaxError(`${tag} does not allow attribute ${key}`,null,JSON.stringify(value),node.location))
        }
    })
    if(node.options?.attributes.style) {
        const styleAllowed = config.styleAllowed;
        if(typeof(styleAllowed)==="function") {
            node.options.style = styleAllowed(node.options.style,node);
        } else if(!styleAllowed) {
            delete node.options.style;
            errors.push(new parser.SyntaxError(`${tag} does not allow styling. Dropping style`,null,null,node.location))
        }
    }
    if(tag!==node.tag) { // node was transformed to a different node type, so validate that also
        await validateNode({node,path,errors});
    }
    return errors;
};
const toDOMNodes = (nodes,parentConfig) => {
        return nodes.reduce((domNodes,node) => {
            if(typeof(node)==="string") {
                if(parentConfig && parentConfig.breakOnNewline) {
                    const lines = node.split("\n");
                    lines.forEach((line,i) => {
                        domNodes.push(new Text(line));
                        if(i<lines.length-1) {
                            domNodes.push(document.createElement("br"))
                        }
                    })
                } else {
                    domNodes.push(new Text(node));
                }
            } else if(!node.drop) {
                const config = tags[node.tag],
                    el = document.createElement(node.tag),
                    {id,classes,attributes} = node.options||{};
                if(id) el.id = id;
                (classes||[]).forEach((className) => el.classList.add(className));
                Object.entries(attributes||{}).forEach(([key,value]) => { // style mapping done here so that it bypasses earlier sanitation
                    const attributeAllowed = config.attributesAllowed[key];
                    if(key==="style" && value && typeof(value)==="object") {
                        Object.entries(value).forEach(([key,value]) => {
                            key.includes("-") ? el.style.setProperty(key,value) : el.style[key] = value;
                        })
                    } else if(attributeAllowed?.styleMap) {
                        const styleName = attributeAllowed.styleMap;
                        styleName.includes("-") ? el.style.setProperty(styleName,value) : el.style[styleName] = value;
                    } else {
                        el.setAttribute(key,value);
                    }
                });
                if(node.tag==="script") {
                    el.setAttribute("type","module");
                }
                toDOMNodes(node.content,config).forEach((node) => {
                    el.appendChild(node);
                });
                domNodes.push(el);
                const listeners = Object.entries(config.listeners||{});
                if(listeners.length>0) {
                    const script = document.createElement("script");
                    script.innerHTML = listeners.reduce((string,[name,f]) => {
                        let fstring = f +"";
                        if(fstring.startsWith(`${name}(`)) {
                            fstring = fstring.replace(`${name}(`,"function(")
                        }
                        string += `document.currentScript.previousElementSibling.addEventListener("${name}",${fstring});\n`;
                        if(name==="attributeChanged") {
                            string += "secstObserver.observe(document.currentScript.previousElementSibling,{attributes:true,attributeOldValue:true}});\n";
                        } else if(name==="disconnected") {
                            string += "secstObserver.observe(document.currentScript.previousElementSibling.parentElement,{childList:true}});\n";
                        }
                        return string;
                    },"");
                    domNodes.push(script);
                }
            }
            return domNodes;
        },[])
    },
    configureStyles = (tags,styleAllowed) => {
        if(styleAllowed==="*") {
            Object.values(tags).forEach((config) => {
                config.styleAllowed ||= true;
            })
        } else if(typeof(styleAllowed)==="function") {
            Object.values(tags).forEach((config) => {
                config.styleAllowed ||= styleAllowed;
            })
        } else {
            Object.entries(styleAllowed||[]).forEach(([key,value]) => {
                let config;
                if(typeof(value)==="function") {
                    config = tags[key];
                    config.styleAllowed ||= value;
                } else {
                    config = tags[value];
                    config.styleAllowed ||= true;
                }
                if(!config) {
                    console.error(new parser.SyntaxError(`${key} is not a defined tag and can't be styled`,null,null,node.location))
                }
            })
        }
    };

const AsyncFunction = (async function () {}).constructor;

const resolveDataTemplate = async (root,string,requestor) => {
    if(!string) return;
    const text = await replaceAsync(string,/\$\(([^)]*)\)/g,async (match,selector) => {
        let els,
            expectsArray;
        if(selector.endsWith("[]")) {
            expectsArray = true;
            els = [...root.querySelectorAll(selector)].filter((el) => {
                if(el.tagName==="INPUT" && el.hasAttribute("data-template")) {
                    return true;
                }
            });
        } else {
            const el = root.querySelector(selector);
            if(el.tagName==="INPUT" && el.hasAttribute("data-template")) {
                els = [el];
            }
        }
        for(const el of els) {
            el.dependents ||= new Set();
            if(requestor) el.dependents.add(requestor);
            if(el.rawValue==null) {
                el.rawValue = "";
            }
            if(el.value==="" || !requestor) {
                el.rawValue = await resolveDataTemplate(root,el.getAttribute("data-template"),el);
                el.value = formatValue(el);
                if(el.hasAttribute("data-autosize")) {
                    el.style.width = Math.min(80,Math.max(1,el.value.length))+"ch";
                }
            }
        }
        const result = expectsArray ? els.map(el => el.rawValue) : els[0].rawValue
        return result && typeof(result)==="object" && !(result instanceof Promise) ? JSON.stringify(result) : result;
    });
    return (new AsyncFunction("return `${" + text + "}`"))();
}

const resolveValueElements = async (node) => {
    const valueEls = [...node.querySelectorAll("input[data-template]")];
    for(const el of valueEls) {
        const template = el.getAttribute("data-template");
        el.value = resolveDataTemplate(node,template,el).then((value) => {
            el.rawValue = value;
            el.value = formatValue(el);
            if(el.hasAttribute("data-autosize")) {
                el.style.width = Math.min(80,Math.max(1,el.value.length))+"ch";
            }
            if(value===template) {
                el.removeAttribute("disabled");
            } else {
                el.setAttribute("disabled","");
            }
        });
        await el.value; // awaiting after the assignment prevent getting stuck in an Inifnite wait due to recursive resolves
    }
};

const transform = async (text,{styleAllowed}={}) => {
    if(typeof(window)==="object" && typeof(MutationObserver)=="function") {
        window.secstObserver ||= new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                const target = mutation.target;
                if (mutation.type === "attributes") {
                    const event = new Event("attributeChanged");
                    event.attributeName = mutation.attributeName;
                    event.attributeNamespace = mutation.attributeNamespace;
                    event.oldValue = mutation.oldValue;
                    event.value = target.getAttribute(event.attributeName);
                    target.dispatchEvent(event);
                } else if(mutation.type==="childList") {
                    [...mutation.removedNodes].forEach((el) => {
                        const event = new Event("disconnected");
                        el.dispatchEvent(event);
                    })
                }
            });
        });
    }
    if(styleAllowed) {
        configureStyles(tags,styleAllowed);
    }
    const tree = patchTopLevel(parser.parse(text,{
        tags: tags,
        styleAllowed: {
            img(style) { return style }
        }
        //img(https://www.google.com)[]
    }));
    const errors = await tree.reduce(async (errors,node) => {
        return [...await errors,...await validateNode({node})]
    },[]);
    const output = document.createElement("div");
    toDOMNodes(tree).forEach((node) => {
        output.appendChild(node);
    })
    await resolveValueElements(output);
    return {el:output,errors};
}

const listeners = {
    change(event) {
        const template = event.target.getAttribute("data-template");
        if(event.target.tagName==="INPUT" && template!==null && (event.target.value+"")!=="[object Promise]") {
            if(event.target.type==="checkbox") {
                if(event.target.value!==event.target.checked+"") {
                    event.target.value = event.target.checked+"";
                }
            }
            event.target.setAttribute("data-template",extractValue(event.target));
            [...event.target.dependents||[]].forEach(async (el) => {
                el.rawValue = await resolveDataTemplate(document.body,el.getAttribute("data-template"));
                el.value = formatValue(el);
                if(el.hasAttribute("data-autosize")) {
                    el.style.width = Math.min(80,Math.max(1,el.value.length))+"ch";
                }
            })
        }
    },
    click() {
        if(event.target.tagName==="INPUT" && event.target.type==="checkbox") {
            if(event.target.value!==event.target.checked+"") {
                event.target.value = event.target.checked+"";
            }
        }
    },
    input(event) {
        const template = event.target.getAttribute("data-template");
        if(event.target.tagName==="INPUT" && template!==null) {
            event.target.setAttribute("data-template",extractValue(event.target));
            event.target.style.width = Math.min(80,Math.max(1,event.target.value.length))+"ch";
            [...event.target.dependents||[]].forEach(async (el) => {
                el.rawValue = await resolveDataTemplate(document.body,el.getAttribute("data-template"));
                el.value = formatValue(el);
                if(el.hasAttribute("data-autosize")) {
                    el.style.width = Math.min(80,Math.max(1,el.value.length))+"ch";
                }
            })
        }
    }
}

if(typeof(jsdom)==="function" && "object"==="object") {
   module.exports = {
       transform
   }
}

if(typeof(window)==="object") {
    window.SECST = {
        listeners,
        transform
    }
}


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/harmony module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.hmd = (module) => {
/******/ 			module = Object.create(module);
/******/ 			if (!module.children) module.children = [];
/******/ 			Object.defineProperty(module, 'exports', {
/******/ 				enumerable: true,
/******/ 				set: () => {
/******/ 					throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + module.id);
/******/ 				}
/******/ 			});
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(694);
/******/ 	
/******/ })()
;