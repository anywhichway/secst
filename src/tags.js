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
    simpleContent = ["a","abbr","bdi","bdo","br","del","code","em","footnote","ins","kbd","strong","sub","sup","time","var","wbr","underline","#","@linkedin"],
    structuredContent = ["address","aside","bdi","cite","details","input","output","value"],
    inlineContent = [...simpleContent,...structuredContent],
    tagToText = (tag) => {
        const type = typeof(tag);
        if(type==="string") return tag.replace(/</g,"&lt;").replace(/>/g,"&gt;");
        if(tag && type==="object") {
            const attributes = tag.attributes ? Object.entries(tag.attributes).filter(([_,value]) => value!=="").map(([key,value]) => key + '="' + value + '"') : null,
                binaryAttributes = tag.attributes ? Object.entries(tag.attributes).filter(([_,value]) => value==="").map(([key,value]) => key) : null,
                classList = tag.classList
            let text = tag.tag;
            if(tag.id || classList?.length>0 || attributes?.length>0) {
                text += `(${tag.id ? "#" + tag.id + " " : ""}${classList ? classList.join(" ") + " " : ""}${binaryAttributes?.length>0 ? binaryAttributes.join(" ") + " " : ""}${attributes?.length>0 ? attributes.join(" ") : ""})`
            }
            return text + `[${tag.content.map((item) => tagToText(item)).join(",")}]`
        }
        return tag;
    };

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
            node.attributes.href = `https://linkedin.com/${node.content[0].trim()}`
        }
    },
    "#": {
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            const hash = node.content[0].trim();
            node.id = hash;
            node.content = ["#"+hash];
        }
    },
    "math-science-formula": {
        requires: [
            {
                tag: "script",
                attributes: {
                    type:"application/javascript",
                    src:"https://cdn.jsdelivr.net/npm/@anywhichway/quick-component@0.0.12",
                    async: "",
                    component: "https://cdn.jsdelivr.net/npm/@anywhichway/math-science-formula@0.0.5"
                }
            }
        ],
        contentAllowed: true
    },
    a: {
        attributesAllowed: {
            href: {
                validate(value) {
                    try {
                        new URL(value,document.baseURI);
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
            target: true,
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
        contentAllowed: [...simpleContent],
        transform(node) {
            if(node.attributes.url) {
                node.attributes.href = node.attributes.url;
                delete node.attributes.url
            }
        }
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
            const language = node.attributes.language,
                run = node.attributes.run,
                content = [...node.content];
            if(run==null) {
                node.content = content.map((item) => tagToText(item))
            } else {
                node.content = [content.map((item) => tagToText(item)).join("\n")]
                if(language==="latex") {
                    node.tag = "math-science-formula";
                }
            }
            delete node.attributes.language;
            delete node.attributes.run;
        }
    },
    dd: {
        contentAllowed: inlineContent
    },
    dl: {
        contentAllowed: ["dt","dd"]
    },
    dt: {
        contentAllowed: simpleContent
    },
    emoticon: {
        attributesAllowed: {
            name: true
        },
        toText(node) {
            return ":" + node.attributes.name;
        }
    },
    footnote: {
        contentAllowed: [...blockContent,...inlineContent].filter((item) => item!=="footnote")
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
                node.attributes.title ||= node.content[0];
                node.attributes.alt ||= node.content[0];
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
                        if(line.length===0) return;
                        const num = parseInt(line),
                            nl = i<lines.length-1 ? "\n" : "";
                        if(typeof(num)==="number" && !isNaN(num)) {
                            line = line.substring((num+".").length);
                            if(num!==1 && node.attributes.start==null) {
                                node.attributes.start = num;
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
            if(node.attributes.selector) {
                node.content = [`${node.attributes.selector} { ${node.content.join(";")} }`]
                delete node.attributes.selector;
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
        contentAllowed: ["li"],
        transform(node) {
            node.content = node.content.reduce((content,item) => {
                if(typeof(item)==="string") {
                    const lines = item.split("\n");
                    let listitem = "";
                    lines.forEach((line,i) => {
                        line = line.trim();
                        if(line.length===0) return;
                        const nl = i<lines.length-1 ? "\n" : "";
                        if(line.startsWith("- ")) {
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
    underline: {
        attributesAllowed: {
            style: true
        },
        contentAllowed: inlineContent,
        styleAllowed() { return {"text-decoration":"underline"}},
        transform(node) {
            node.attributes.style =  {"text-decoration":"underline"};
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
                        node.attributes["data-format"] = "$${value}";
                        node.attributes["data-extract"] = "\\$([\\d.]*)";
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
            node.attributes ||= {};
            node.attributes.hidden = "";
            if (node.attributes.visible == "") {
                delete node.attributes.hidden;
                delete node.attributes.visible;
            }
            if (node.attributes["data-default"] == null) {
                node.attributes["data-default"] = "";
            }
            if(node.attributes.src) {
                if(node.attributes.static!=null) {
                    delete node.attributes.static;
                    const response = await fetch(node.attributes.src);
                    node.attributes.value = await response.text();
                } else {
                    const f = `await (async () => { 
                        const response = await fetch("${node.attributes.src}");
                        return await response.text();
                        })()`;
                    node.attributes["data-template"] = f;
                }
                delete node.attributes.src;
            } else {
                node.attributes["data-template"] = node.content.join("").trim();
                node.attributes.value = node.attributes["data-default"]
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



export {universalAttributes, tags}
