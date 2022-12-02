import katex from "katex";
await import("katex/contrib/mhchem");

import JSON5 from "json5";

let emojiMartData,
    initEmojiMart,
    EmojiMartSearchIndex;
const __em__ = await import("emoji-mart");
// this craziness required because emoji-mart exports no default but is common JS on server but esm on client and conditions are inside emoji-mart code
// as a result, standard webpack handling breaks
const {init,SearchIndex} = __em__;
if(init) {
    initEmojiMart = init;
    EmojiMartSearchIndex = SearchIndex;
} else {
    const {init:_initEmojiMart, SearchIndex:_EmojiMartSearchIndex} = __em__.default;
    initEmojiMart = _initEmojiMart;
    EmojiMartSearchIndex = _EmojiMartSearchIndex;
}

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
    blockContent = ["article","audio","blockquote","code","dl","figure","hr","img","script","listeners","ol","p","picture","pre","script","style","table","toc","ul","video","latex","math-science-formula"],
    singleLineContent = ["a","abbr","bdi","bdo","br","del","code","em","emoji","error","footnote","hashtag","ins","kbd","meter","strong","sub","sup","time","value","var","wbr","u","@facebook","@github","@linkedin","@twitter","latex"],
    multiLineContent = ["address","aside","bdi","cite","details","input","script","ol","output","ruby","ul","summary","textarea","transpiled"],
    inlineContent = [...singleLineContent,...multiLineContent],
    tagToText = (tag,pre) => {
        const type = typeof(tag);
        if(type==="string") return tag.replace(/</g,"&lt;").replace(/>/g,"&gt;");
        if(tag && type==="object") {
            const attributes = tag.attributes ? Object.entries(tag.attributes).filter(([_,value]) => value!=="").map(([key,value]) => key + '="' + value + '"') : null,
                binaryAttributes = tag.attributes ? Object.entries(tag.attributes).filter(([_,value]) => value==="").map(([key]) => key) : null,
                classList = tag.classList
            let text = tag.tag;
            if(tag.id || classList?.length>0 || attributes?.length>0) {
                text += `(${tag.id ? "#" + tag.id + " " : ""}${classList ? classList.join(" ") + " " : ""}${binaryAttributes?.length>0 ? binaryAttributes.join(" ") + " " : ""}${attributes?.length>0 ? attributes.join(" ") : ""})${pre ? "\n" : ""}`
            }
            return (text + `[${pre ? "\n" : ""}${tag.content.reduce((text,item,index,array) => { text += tagToText(item,pre); return index<array.length-2 ? text += "," : text; },"")}]`)
                .replace(/[\r\n][\s\t]*(.*)/g,"\n$1")
        }
        return tag;
    };

for(let i=1;i<=8;i++) {
    blockContent.push("h"+i)
}

const tags = {
    "@facebook": {
        attributesAllowed: {
            href: true,
            target: true
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            node.attributes.href = `https://facebook.com/${node.content[0].trim()}`
        }
    },
    "@github": {
        attributesAllowed: {
            href: true,
            target: true
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            node.attributes.href = `https://github.com/${node.content[0].trim()}`
        }
    },
    "@linkedin": {
        attributesAllowed: {
            href: true,
            target: true
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            node.attributes.href = `https://linkedin.com/in/${node.content[0].trim()}`
        }
    },
    "@twitter": {
        attributesAllowed: {
            href: true,
            target: true
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            node.attributes.href = `https://twitter.com/${node.content[0].trim()}`
        }
    },
    "math-science-formula": {
        requires: [
            {
                tag: "script",
                attributes: {
                    type:"application/javascript",
                    src:"https://cdn.jsdelivr.net/npm/@anywhichway/quick-component@0.0.14",
                    async: "",
                    component: "./math-science-formula"  //"https://cdn.jsdelivr.net/npm/@anywhichway/math-science-formula@0.0.5"
                }
            }
        ],
        contentAllowed: true,
        toText(node) {
            return node.content.join("")
        }
    },
    latex: {
        contentAllowed: true,
        requires: [
            {
                tag: "link",
                attributes: {
                    rel: "stylesheet",
                    href: "https://cdn.jsdelivr.net/npm/katex@0.16.3/dist/katex.min.css",
                    integrity: "sha384-Juol1FqnotbkyZUT5Z7gUPjQ9gzlwCENvUZTpQBAPxtusdwFLRy382PSDx5UUJ4/",
                    crossOrigin: "anonymous"
                }
            }
            ],
        transform(node) {
            const content = node.content.join("\n");
            if(content.endsWith("\n")) {
                node.tag = "div";
            } else {
                node.tag = "span";
            }
            node.content = [content];
            node.skipRevalidation = true;
            node.skipContent = true;
        },
        toHTML(node) {
            return katex.renderToString(node.content[0],{
                throwOnError: false
            })
        }
        /*render(node,el) {
            return katex.render(node.content[0],el)
        }
        connected(el) {
            katex.render(el.innerText, el, {
                throwOnError: false
            });
        }*/
    },
    "&": {
        contentAllowed: true,
        transform(node) {
            node.tag = "span";
            node.content = ["&"+node.content[0]+";"];
            node.skipRevalidation = true;
        }
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
        contentAllowed: [...singleLineContent],
        transform(node) {
            if(node.attributes.url) {
                node.attributes.href = node.attributes.url;
                delete node.attributes.url
            } else {
                const href = node.content[0];
                if(href.startsWith("https:") || href.startsWith("./") || href.startsWith("../")) {
                    try {
                        new URL(href,document.baseURI);
                        node.attributes.href = node.content[0];
                        node.attributes.target = "_tab";
                    } catch {

                    }
                }
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
        contentAllowed: [...inlineContent, "blockquote"],
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
        contentAllowed: singleLineContent,
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
                const block = node.content.some((item) => typeof(item)==="string" && item.includes("\n"));
                node.content = content.map((item) => tagToText(item,block));
                if(block) {
                    const lastline = node.content[node.content.length-1];
                    if(lastline.endsWith("\n")) {
                        node.content[node.content.length-1] = lastline.substring(0,lastline.length-1)
                    }
                    const code = JSON.parse(JSON.stringify(node));
                    node.tag = "pre";
                    node.id = null;
                    node.content = [code];
                    node.skipContent = true;
                }
            } else {
                node.content = [node.content.join("\n")]
                if(language==="latex") {
                    node.tag = "math-science-formula";
                }
            }
            delete node.attributes.language;
            delete node.attributes.run;
        }
    },
    details: {
        contentAllowed: [...singleLineContent,...multiLineContent],
        validate(node) {
            return node.firstElementChild?.tagName==="SUMMARY";
        }
    },
    dd: {
        contentAllowed: inlineContent
    },
    dl: {
        contentAllowed: ["dt","dd"]
    },
    dt: {
        contentAllowed: singleLineContent
    },
    error: {
        contentAllowed: "*",
        transform(node) {
            node.tag = "mark";
            node.classList.add("secst-error");
        }
    },
    emoji: {
        contentAllowed: true,
        async toHTML(node) {
            emojiMartData ||= await fetch(
                'https://cdn.jsdelivr.net/npm/@emoji-mart/data',
            ).then((response) => response.json());
            initEmojiMart({emojiMartData});
            const emojis = []
            for(const item of node.content) {
                for(const tag of item.split(" ")) {
                    try {
                        const found = await EmojiMartSearchIndex.search(tag);
                        if(found[0]?.id===tag) {
                            const unified = found[0].skins[0].unified;
                            emojis.push("&#x" + unified.split("-").shift() + ";")
                            //emojis.push(found[0].skins[0].native)
                        } else {
                            emojis.push(":" + tag)
                        }
                    } catch(e) {
                        console.log(e)
                    }
                }
            }
            return emojis.join(", ")
        }
    },
    footnote: {
        contentAllowed: [...blockContent,...inlineContent].filter((item) => item!=="footnote"),
        attributesAllowed: {
            href: true
        },
        transform(node) {
            node.tag = "sup";
            node.classList.push("autohelm-footnote")
            node.skipRevalidation = true;
        }
    },
    figure: {
        contentAllowed:[...blockContent,...inlineContent,"caption"].filter((item) => item!=="figure")
    },
    hashtag: {
        contentAllowed: true,
        transform(node) {
            // push to meta tags here
        },
        toText(node) {
            return node.content.reduce((tags,item) => {
               item.split(" ").forEach((tag) => tags.push("#" + tag));
               return tags;
            },[]).join(", ")
        }
    },
    hr: {
        allowAsRoot: true
    },
    input: {
        allowAsRoot: true,
        attributesAllowed: {
            "data-fitcontent": true,
            "data-default": true,
            "data-extract": true, // toto add validation
            "data-template": true,
            "data-format": true,
            "data-mime-type": true, // toto add validation
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
            static:true,
            src: true,
            url(value) {
                return {
                    src: value
                }
            }
        },
        async transform(node) {
            if (node.content[0]) {
                node.attributes.title ||= node.content[0];
                node.attributes.alt ||= node.content[0];
                node.content.shift();
            }
            if(node.attributes.static!==null && node.attributes.url) {
                delete node.attributes.static;
                try {
                    const response = await fetch(node.attributes.url);
                    if(response.status===200) {
                        try {
                            const blob = await response.blob(),
                                arrayBuffer = await blob.arrayBuffer(),
                               base64 = btoa(new Uint8Array(arrayBuffer).reduce((data,byte)=>(data.push(String.fromCharCode(byte)),data),[]).join(''));
                            node.attributes.src = await new Promise(r => {let a=new FileReader(); a.onload=r; a.readAsDataURL(blob)})
                                .then((e) => {
                                    if(e.target.result.length<50 && e.target.result.endsWith(","))  {
                                        return e.target.result + base64; // handles improper read on server using happy-dom
                                    }
                                    return e.target.result;
                                });
                            delete node.attributes.url
                        } catch(e) {

                        }
                    }
                } catch(e) {

                }
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
    meter: {
      attributesAllowed: {
          min: {
              validate(value) {
                  return (value==parseFloat(value) || value==parseInt(value))
              }
          },
          max: {
              validate(value) {
                  return (value==parseFloat(value) || value==parseInt(value))
              }
          },
          low: {
              validate(value) {
                  return (value==parseFloat(value) || value==parseInt(value))
              }
          },
          high: {
              validate(value) {
                  return (value==parseFloat(value) || value==parseInt(value))
              }
          },
          optimum: {
              validate(value) {
                  return (value==parseFloat(value) || value==parseInt(value))
              }
          }
      },
        validate(node) {
          // todo see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meter
          return true;
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
    pre: {
        contentAllowed: true
    },
    ruby: {
        contentAllowed: [...singleLineContent,"rp","rt"]
    },
    script: {
        attributesAllowed: {
            type: {
                validate(value) {
                    const values = [
                        "application/json",
                        "text/plain",
                        "text/csv"
                    ];
                    if(values.includes(value)) {
                        return true;
                    }
                    throw new TypeError(`value for script type ${value} must be one of ${JSON.stringify(values)}`);
                }
            },
            src: {
                validate(value) {
                    if(new URL(value,document.baseURI)) {
                        return true;
                    }
                }
            },
            static: true,
            visible: {
                mapStyle: {
                    display: "block",
                    fontFamily: "monospace",
                    whiteSpace: "pre",
                    unicodeBidi: "embed"
                }
            }
        },
        allowAsRoot: true,
        contentAllowed: true,
        toHTML(node) {
            return node.content[0]
        },
        async transform(node) {
            if(node.attributes.url) {
                node.attributes.src = node.attributes.url;
                delete node.attributes.url;
            }
            if(node.attributes.src && node.attributes.static!=null) {
                const response = await fetch(node.attributes.src);
                if(response.status==200) {
                    try {
                        let text = await response.text();
                        if(node.attributes.type==="application/json") {
                           text = JSON.stringify(JSON5.parse(text),null,2);
                        }
                        node.content = [text]
                    } catch(e) {
                        node.content = [e+""]
                    }
                } else {
                    node.contents = [response.statusText]
                }
                delete node.attributes.src;
                delete node.attributes.static
            }
        },
        validate(node) {
            if(!node.attributes.type) {
                return false;
            }
            return true;
        }
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
        contentAllowed:["thead","tbody","tfoot","caption","tr"],
        transform(node) {
            node.classList.push("secst");
            // todo: normalize table so all rows have length of max length row
        }
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
    textarea: {
        allowAsRoot: true,
        contentAllowed:true,
        attributesAllowed: {
            "data-fitcontent": true,
            "data-default": true,
            "data-extract": true, // toto add validation
            "data-template": true,
            "data-format": true,
            "data-mime-type": true, // toto add validation
            disabled: true,
            value: true
        },
        render(node,el) {
            el.innerHTML = node.attributes.value || node.content[0];
            if(el.hasAttribute("data-fitcontent")) {
                const lines = el.innerText.split("\n");
                el.style.height = (Math.min(20,lines.length)*1.5) + "em";
                el.style.width = Math.min(80,lines.reduce((len,line) => Math.max(len,line.length),0)) + "ch";
            }
        },
        transform(node) {
            node.content = [node.content.join("\n")];
        }
    },
    th: {
        attributesAllowed: {
            colspan: {
                validate(value) {
                    return parseInt(value)===value+"";
                }
            }
        },
        contentAllowed: singleLineContent
    },
    thead: {
        contentAllowed:["td","th"],
        transform(node) {
            const line = [];
            node.content.forEach((item,i,content) => {
                if(typeof(item)==="string") {
                    const items = item.split("|").map((item) => item.trim());
                    for(let i=0;i<items.length;i++) {
                        if(items[i]==="") {
                            if(typeof(items[i+1])==="string") {
                                lines.push(items[i]);
                            }
                        } else {
                            line.push(items[i]);
                        }
                    }
                } else {
                    line.push(item);
                }
            });
            node.content = line.map((item) => {
                if(typeof(item)==="string") return {tag:"th", content:[item]};
                return item;
            })
        }
    },
    toc: {
        contentAllowed: true,
        transform(node) {
            node.tag = "h1";
            if(!node.classList.includes("toc")) {
                node.classList.push("toc");
            }
            if(node.content.length===0) {
                node.content = ["Table of Contents"]
            }
        }
    },
    tr: {
        attributesAllowed: {
            rowspan: {
                validate(value) {
                    return parseInt(value)===value+"";
                }
            }
        },
        contentAllowed: ["td","th"],
        transform(node) {
            const line = [];
            node.content.forEach((item,i,content) => {
                if(typeof(item)==="string") {
                    const items = item.split("|").map((item) => item.trim());
                    for(let i=0;i<items.length;i++) {
                        if(items[i]==="") {
                            if(typeof(items[i+1])==="string") {
                                line.push(items[i]);
                            }
                        } else {
                            line.push(items[i]);
                        }
                    }
                } else {
                    line.push(item);
                }
            });
            node.content = line.map((item) => {
                if(typeof(item)==="string") return {tag:"td", content:[item]};
                return item;
            })
        }
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
    transpiled: {
        contentAllowed: "*",
        mounted(el) {
            el.innerHTML = el.innerHTML.replace(/</g,"&lt;").replace(/>/g,"&gt;");
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
    u: {
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
            "data-fitcontent": true,
            "data-default": true,
            "data-extract": true,
            "data-format": true,
            "data-template": true,
            "data-mime-type": true,
            fitcontent() {
                return {
                    "data-fitcontent": ""
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
            src: {
                validate(value) {
                    if(new URL(value,document.baseURI)) {
                        return true;
                    }
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
                    if([
                        "application/json",
                        "text/plain",
                        "text/csv"
                    ].includes(value)) {
                        node.attributes["data-mime-type"] = value;
                        return {
                            type: "text"
                        }
                    }
                },
                validate(value, node) {
                    const values = ["checkbox","color","date","datetime-local","email","file",
                        "hidden","month","number","password","radio","range","tel","text",
                        "time","url","week","currency-usd","boolean",
                        "application/json","text/plain","text/csv"
                    ]
                    if(!values.includes(value)) {
                        throw new TypeError(`value for script type ${value} must be one of ${JSON.stringify(values)}`);
                    }
                    return true;
                }
            },
            value: true
        },
        async transform(node) {
            let type = node.attributes.type;
            if(["application/json","text/plain","text/csv"].includes(type)) {
                node.tag = "textarea";
                node.classList.push("secst");
                node.attributes["data-mime-type"] = type;
                node.skipContent;
                delete node.attributes.type;
            } else {
                node.tag = "input";
            }
            node.attributes.hidden = "";
            if (node.attributes.visible == "") {
                delete node.attributes.hidden;
                delete node.attributes.visible;
            }
            if(node.attributes.url) {
                node.attributes.src = node.attributes.url;
                delete node.attributes.url;
            }
            if (node.attributes["data-default"] == null) {
                node.attributes["data-default"] = "";
            }
            if(node.attributes.src) {
                if (node.attributes.static != null) {
                    delete node.attributes.static;
                    const response = await fetch(node.attributes.src);
                    if (response.status == 200) {
                        try {
                            let text = await response.text();
                            if (type === "application/json") {
                                text = JSON.stringify(JSON5.parse(text), null, 2);
                            }
                            node.attributes.value = text;
                        } catch (e) {
                            node.attributes.value = e + "";
                        }
                    } else {
                        node.value = response.statusText
                    }
                } else {
                    const f = `await (async () => { 
                        const response = await fetch("${node.attributes.src}");
                        if(response.status===200) {
                            try {
                                return await response.text();
                            } catch(e) {
                                return e+"";
                            }
                        } else {
                            return response.statusText;
                        }
                        })()`;
                    node.attributes["data-template"] = f;
                }
                delete node.attributes.src;
            } else {
                node.attributes["data-template"] = node.content.join("").trim();
                node.attributes.value = node.attributes["data-default"]
            }
            if(node.tag==="input") {
                node.content = [];
            }
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
        contentAllowed: singleLineContent
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
