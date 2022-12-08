import katex from "katex";
await import("katex/contrib/mhchem");

import JSON5 from "json5";

import {updateValueWidths} from "./update-value-widths.js";


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

const deferedTags = (tagArray) => {
    return tagArray.reduce((deferedTags,tag) => { deferedTags[tag] = () => tags[tag]; return deferedTags},{})
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
    blockContent = deferedTags(["article","audio","blockquote","code","dl","figure","h1","h2","h3","h4","h5","h6","hr","img","script","listeners","meta","ol","p","picture","pre","script","style","table","toc","ul","video","latex","math-science-formula","NewsArticle","Person"]),
    singleLineContent = deferedTags(["&","a","abbr","bdi","bdo","br","del","code","em","emoji","error","escape","footnote","hashtag","ins","kbd","mark","meta","meter","strike","strong","sub","sup","time","value","var","wbr","u","@facebook","@github","@linkedin","@twitter","latex","name"]),
    multiLineContent = deferedTags(["address","aside","bdi","cite","details","input","script","ol","output","ruby","ul","textarea","transpiled","author","NewsArticle"]),
    inlineContent = {...singleLineContent,...multiLineContent},
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
            return (text + `{${pre ? "\n" : ""}${tag.content.reduce((text,item,index,array) => { text += tagToText(item,pre); return index<array.length-2 ? text += "," : text; },"")}}`)
                .replace(/[\r\n][\s\t]*(.*)/g,"\n$1")
        }
        return tag;
    };


const tags = {
    NewsArticle: {
        allowAsRoot: true,
        contentAllowed: {
            headline: {
                attributesAllowed: {
                    level: true
                },
                contentAllowed: true,
                minCount: 0,
                maxCount: 1,
                toJSONLD(node) {
                    return node.content[0]
                },
                beforeMount(node) {
                    const level = node.attributes.level || 1;
                    node.tag = "h" + level;
                    delete node.attributes.level;
                }
            },
            p() {
                return tags.p;
            },
            datePublished: {
                attributesAllowed:{
                    "data-format": true,
                    lang: true,
                    format(value) {
                        return {
                            "data-format": value
                        }
                    }
                },
                contentAllowed: Date,
                minCount: 0,
                maxCount: 1,
                toText(node) {
                    const lang = node.attributes.lang || document.documentElement.getAttribute("lang") || "en",
                        options = node.attributes["data-format"] ? JSON5.parse(node.attributes["data-format"]) : undefined,
                        formatted = new Intl.DateTimeFormat(lang,options).format(new Date(node.content[0]));
                    return formatted;
                }
            },
            author: {
                contentAllowed: {
                    name: {
                        contentAllowed: true,
                        toJSONLD(node) {
                            node.classList.push("JSON-LD-author-name");
                            return {name:node.content[0]}
                        },
                        beforeMount(node) {
                            node.tag = "span"
                        }
                    },
                    Person() { return tags.Person }
                },
                beforeMount(node) {
                    node.tag = "span"
                },
                minCount: 1,
                toJSONLD(node) {
                    const author = node.getContentByTagName("name")[0] || node.getContentByTagName("Person")[0];
                    if(author) return author.toJSONLD(author);
                }
            },
            img() {
                return tags.img;
            }
        },
        toJSONLD(node) {
            node.classList.push("JSON-LD-NewsArticle");
            const headlines = node.getContentByTagName("headline"),
                images = node.getContentByTagName("img"),
                authors = node.getContentByTagName("author"),
                headline = headlines.length===1 ? headlines[0] : null;
            const jsonld = {
                headline: headline.content[0],
                images: images.reduce((images,img) => {
                    const src = img.toJSONLD(img);
                    if(src) images.push(src);
                    return images;
                },[]),
                author: authors.map((author) => author.toJSONLD(author))
            }
            console.log(jsonld);
        },
        beforeMount(node) {
            node.tag = "div";
        }
    },
    Person: {
        allowAsRoot: true,
        contentAllowed: {
            name: {
                contentAllowed: true,
                minCount: 1,
                maxCount: 1,
                toJSONLD(node) {
                    node.classList.push("JSON-LD-Person-name");
                    return {name:node.content[0]};
                }
            }
        },
        toJSONLD(node) {
            node.classList.push("JSON-LD-Person");
            const name = node.getContentByTagName("name")[0];
            return {
                "@type": "Person",
                name: name.toJSONLD(name).name
            }
        },
        beforeMount(node) {
            node.tag = "span";
        }
    },
    "@facebook": {
        attributesAllowed: {
            href: true,
            target: true
        },
        contentAllowed: true,
        transform(node) {
            node.tag = "a";
            node.attributes.target ||= "_tab";
            const user = node.attributes.user || node.content[0].trim();
            node.attributes.href = `https://facebook.com/${user}`;
            if(!node.attributes.user) {
                node.content[0] = node.content[0] + "@facebook";
            }
            delete node.attributes.user;
            return node;
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
            const user = node.attributes.user || node.content[0].trim();
            node.attributes.href = `https://github.com/${user}`;
            if(!node.attributes.user) {
                node.content[0] = node.content[0] + "@github";
            }
            delete node.attributes.user;
            return node;
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
            const user = node.attributes.user || node.content[0].trim();
            node.attributes.href = `https://linkedin.com/in/${user}`;
            if(!node.attributes.user) {
                node.content[0] = node.content[0] + "@linkedin";
            }
            delete node.attributes.user
            return node;
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
            const user = node.attributes.user || node.content[0].trim();
            node.attributes.href = `https://twitter.com/${user}`
            if(!node.attributes.user) {
                node.content[0] = node.content[0] + "@twitter";
            }
            delete node.attributes.user;
            return node;
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
            node.content = [node.content.join("\n")];
            node.skipContent = true;
            return node;
        },
        beforeMount(node) {
            if(node.content[0].endsWith("\n")) {
                node.tag = "div";
            } else {
                node.tag = "span";
            }
        },
        toHTML(node) {
            return katex.renderToString(node.content[0],{
                throwOnError: false
            })
        }
    },
    "&": {
        contentAllowed: true,
        transform(node) {
            const values = node.content[0].split(" ");
            node.content = [values.map((item) => "&"+item+";").join("")];
            return node;
        },
        beforeMount(node) {
            node.tag = "span";
        }
    },
    a: {
        attributesAllowed: {
            url(value) {
                this.href(value);
                return {
                    href: value
                }
            },
            href(value) {
                new URL(value,document?.baseURI);
            },
            ping(value) {
                const urls = value.split(" ");
                urls.forEach((url) => {
                    try {
                        new URL(url);
                    } catch {
                        throw new TypeError(`${url} is not a valid url for ping`)
                    }
                });
            },
            referrerpolicy(value) {
                const policies = ["no-referrer","no-referrer-when-downgrade","origin","origin-when-cross-origin","same-origin",
                    "strict-origin","strict-origin-when-cross-origin"];
                if(!policies.includes(value)) {
                    throw new TypeError(`referrer policy ${value} is not one of ${JSON.stringify(policies)}`)
                }
            },
            target: true,
            type(value) {
                const parts = value.split("/");
                if(parts.length!==2 || parts[0].length<1 || parts[1].length<1) {
                    throw new TypeError(`${value} is not a valid MIME type`)
                }
            }
        },
        contentAllowed: {...singleLineContent},
        transform(node) {
            if(node.attributes.url) {
                node.attributes.href = node.attributes.url;
                delete node.attributes.url
            } else {
                const href = node.content[0];
                if(typeof(href)==="string" && (href.startsWith("https:") || href.startsWith("./") || href.startsWith("../"))) {
                    try {
                        new URL(href,document?.baseURI);
                        node.attributes.href = node.content[0];
                        node.attributes.target = "_tab";
                    } catch {

                    }
                }
            }
            return node;
        }
    },
    abbr: {
      contentAllowed: {...singleLineContent}
    },
    article: {
        contentAllowed: "*"
    },
    audio: {
        attributesAllowed: {
            url(value) {
                new URL(value,document?.baseURI);
                return {
                    src: value
                }
            },
            controls: true
        },
        contentAllowed: deferedTags(["source","track"]),
        transform(node) {
            return node;
        }
    },
    bdo: {
        attributesAllowed: {
            dir(value) {
                if(!["ltr","rtl"].includes(value)) {
                    throw new TypeError(`${value} is not one of ["ltr","rtl"] for bdo`)
                }
            }
        }
    },
    blockquote: {
        allowAsRoot: true,
        contentAllowed: {...inlineContent, blockquote() { return tags.blockquote}},
        attributesAllowed: {
            cite(value) {
                new URL(value)
            }
        }
    },
    br: {

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
            return node;
        },
        beforeMount(node) {
            if(node.attributes.run==null && node.content.some((item) => typeof(item)==="string" && item.includes("\n"))) {
                node.tag = "pre"
            }
        }
    },
    del: {
        contentAllowed: {...singleLineContent}
    },
    details: {
        contentAllowed: {
            summary: {
                contentAllowed:{...singleLineContent}
            },
            ...singleLineContent,
            ...multiLineContent
        },
        transform(node) {
            if(node.content[0].tag!=="summary") {
                const parts = node.content[0].split(" ");
                node.content.unshift(
                    {
                        tag:"summary",
                        content:[parts.shift()]
                    }
                );
                node.content[1] = parts.join(" ");
            }
            return node;
        }
    },
    dl: {
        allowAsRoot: true,
        contentAllowed: {
            dt: {
                contentAllowed:singleLineContent
            },
            dd: {
                contentAllowed: singleLineContent
            }
        }
    },
    error: {
        contentAllowed: "*",
        transform(node) {
            node.tag = "mark";
            node.classList.add("secst-error");
            return node;
        }
    },
    em: {
        contentAllowed: {...singleLineContent}
    },
    emoji: {
        attributesAllowed: {
            colored() {
                return {
                    filter: "none"
                }
            },
            filter: true
        },
        contentAllowed: true,
        async toElement(node) {
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
            const span = document.createElement("span");
            span.style.filter = node.attributes.filter  || "grayscale(100%)";
            span.innerHTML = emojis.join(" ");
            return span;
        }
    },
    escape: {
        contentAllowed: true,
        beforeMount(node) {
            if(node.content.some((item) => item.includes("\n"))) {
                node.tag = "div";
            } else {
                node.tag = "span";
            }
        }
    },
    footnote: {
        contentAllowed: {...blockContent,...inlineContent},
        attributesAllowed: {
            href(value) {
                if(value[0]!=="#") {
                    throw new TypeError(`Footnote href ${value} must start with a #`)
                }
            }
        },
        transform(node) {
            node.classList.push("autohelm-footnote")
            return node;
        },
        beforeMount(node) {
            node.tag = "sup";
        }
    },
    figure: {
        contentAllowed:{
            ...blockContent,
            ...inlineContent,
            caption: {
                contentAllowed:true
            }
        }
    },
    hashtag: {
        contentAllowed: true,
        transform(node) {
            // push to meta tags here
            return node;
        },
        toText(node) {
            return node.content.reduce((tags,item) => {
                item.split(" ").forEach((tag) => tags.push("#" + tag));
                return tags;
            },[]).join(", ")
        },
        connected(el) {
            const tags = el.innerText.split(","),
                meta = document.createElement("meta");
            meta.setAttribute("name","keywords");
            meta.setAttribute("value",tags.join(","))
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
    ins: {
        contentAllowed: {...singleLineContent}
    },
    img: {
        allowAsRoot: true,
        attributesAllowed: {
            alt:true,
            static:true,
            src(value) {
                new URL(value,document.baseURI);
            },
            url(value) {
                this.src(value);
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
            return node;
        },
        toJSONLD(node) {
           if(!node.attributes.src?.startsWith("data:")) {
               return node.attributes.src
           }
        }
    },
    kbd: {
        contentAllowed: {...singleLineContent}
    },
    li: {
        breakOnNewline: true,
        attributesAllowed: {
            value(value) {
                if (parseInt(value) !== value) {
                    throw new TypeError(`Attribute "value" for li must be a number not ${value}`)
                }
            },
            type(value) {
                if (!("aAiI1".includes(value) && value.length === 1)) {
                    throw new TypeError(`Attribute "type" must be one of these letters: aAiI1`)
                }
            }
        },
        contentAllowed: {
            ol() { return tags.ol },
            li() { return tags.li },
            img() { return tags.img },
            ...inlineContent
        },
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
            return node;
        }
    },
    mark: {
        contentAllowed: {...singleLineContent}
    },
    meta: {
        contentAllowed: true,
        attributesAllowed: {
            name: true,
            content: true
        },
        transform(node) {
            node.attributes.content = node.content.join("");
            return node;
        },
        connected(el) {
            document.head.appendChild(el);
        }
    },
    meter: {
        attributesAllowed: {
          min(value) {
              if(!(value==parseFloat(value) || value==parseInt(value))) {
                  throw new TypeError(`${value} must be a number`)
              }
          },
          max(value) {
              if(!(value==parseFloat(value) || value==parseInt(value))) {
                  throw new TypeError(`${value} must be a number`)
              }
          },
          low(value) {
              if(!(value==parseFloat(value) || value==parseInt(value))) {
                  throw new TypeError(`${value} must be a number`)
              }
          },
          high(value) {
              if(!(value==parseFloat(value) || value==parseInt(value))) {
                  throw new TypeError(`${value} must be a number`)
              }
          },
          optimum(value) {
              if(!(value==parseFloat(value) || value==parseInt(value))) {
                  throw new TypeError(`${value} must be a number`)
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
            start(value) {
                if (parseInt(value) !== value) {
                    throw new TypeError(`${value} must be a number`)
                }
            },
            type(value) {
                if (!("aAiI1".includes(value) && value.length === 1)) {
                    throw new TypeError(`Attribute "type" must be one of these letters: aAiI1`)
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
            return node;
        }
    },
    p: {
        allowAsRoot: true,
        breakOnNewline: true,
        contentAllowed: {...inlineContent},
        transform(node) {
            // ignore first return
            if(typeof(node.content[0])==="string" && node.content[0]) {
                node.content[0] =  node.content[0].trimLeft();
            }
            return node;
        },
        attributesAllowed: {
            align: {
                mapStyle: "text-align"
            }
        }
    },
    picture: {
        contentAllowed: {
            img() { return tags.img },
            source() { return tags.source }
        }
    },
    pre: {
        contentAllowed: true
    },
    ruby: {
        contentAllowed: {
            rp: {
                contentAllowed:true,
            },
            rt: {
                contentAllowed: true
            },
            ...singleLineContent
        }
    },
    script: {
        attributesAllowed: {
            type(value) {
                const values = [
                    "application/json",
                    "text/plain",
                    "text/csv"
                ];
                if(!values.includes(value)) {
                    throw new TypeError(`value for script type ${value} must be one of ${JSON.stringify(values)}`);
                }
            },
            url(value) {
                this.src(value);
                return {
                    src: value
                }
            },
            src(value) {
                new URL(value,document.baseURI);
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
            return node;
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
            height(value) {
                if(parseInt(value)!==value+"") {
                    throw TypeError("must be a number")
                }
                /*
                Allowed if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                 */
            },
            media(value) {
                /*
                Allowed if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                 */
            },
            sizes(value) {
                /*
                Allowed if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                 */
            },
            src(value) {
                /*
                Required if the source element's parent is an <audio> and <video> element, but not allowed if the source element's parent is a <picture> element.
                 */
            },
            srcset(value) {
                /*
                Required if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                 */
            },
            width(value) {
                if(parseInt(value)!==value+"") {
                    throw TypeError("must be a number")
                }
                /*
                Allowed if the source element's parent is a <picture> element, but not allowed if the source element's parent is an <audio> or <video> element.
                 */
            }
        },
        parentRequired: ["audio","picture","video"]
    },
    strike: {
        contentAllowed: {...singleLineContent}
    },
    strong: {
        contentAllowed: {...singleLineContent}
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
            return node;
        }
    },
    sub: {
        contentAllowed:true
    },
    sup: {
        contentAllowed:true
    },
    table: {
        allowAsRoot: true,
        contentAllowed: {
            tbody: {
                contentAllowed: {
                    tr() { return tags.tr }
                }
            },
            tfoot: {
                contentAllowed: "*"
            },
            thead: {
                contentAllowed: {
                    td() { return tags.td; },
                    th() { return tags.th; }
                },
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
                    return node;
                }
            },
            caption() { return tags.caption },
            tr() { return tags.tr }
        },
        transform(node) {
            node.classList.push("secst");
            return node;
            // todo: normalize table so all rows have length of max length row
        }
    },
    td: {
        attributesAllowed: {
            colspan(value) {
                if(parseInt(value)!==value+"") {
                    throw new TypeError("must be a numebr");
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
            value: true,
            readonly: true
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
            return node;
        }
    },
    th: {
        attributesAllowed: {
            colspan(value) {
                if(parseInt(value)!==value+"") {
                    throw new TypeError("must be a numebr");
                }
            }
        },
        contentAllowed: singleLineContent
    },
    toc: {
        allowAsRoot: true,
        contentAllowed: true,
        transform(node) {
            node.tag = "h1";
            if(!node.classList.includes("toc")) {
                node.classList.push("toc");
            }
            if(node.attributes.toggle!=null) {
                node.attributes["data-toggle"] = "";
                delete node.attributes.toggle;
            }
            if(node.content.length===0) {
                node.content = ["Table of Contents"]
            }
            return node;
        }
    },
    tr: {
        attributesAllowed: {
            rowspan(value) {
                   if(parseInt(value)!==value+"") {
                       throw new TypeError("must be a number")
                   }
            }
        },
        contentAllowed: {
            td() { return tags.td; },
            th() { return tags.th; }
        },
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
            return node;
        }
    },
    track: {
      parentRequired: ["audio","video"],
      attributesAllowed: {
          default(value,node) {
              /*
              This may only be used on one track element per media element.
               */
          },
          kind(value) {

          },
          label: true,
          url(value) {
            this.src(value);
            return {
                src: value
            }
          },
          src(value) {
              new URL(value,document.baseURI);
              /*
              This attribute must be specified and its URL value must have the same origin as the document — unless the <audio> or <video> parent element of the track element has a crossorigin attribute.
               */
          },
          srclang(value) {

          }
      }
    },
    transpiled: {
        contentAllowed: "*",
        mounted(el) {
            el.innerHTML = `<code>${el.innerHTML.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</code>`;
        }
    },
    ul: {
        allowAsRoot: true,
        indirectChildAllowed: true,
        contentAllowed: {
            li() { return tags.li }
        },
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
            return node;
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
            return node;
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
            "data-editable": true,
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
            editable() {
              return {
                  "data-editable": true
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
            url(value) {
                this.src(value);
                return {
                    src: value
                }
            },
            src(value) {
                new URL(value,document.baseURI)
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
        contentAllowed: true,
        async transform(node) {
            let type = node.attributes.type;
            if(["application/json","text/plain","text/csv"].includes(type)) {
                node.classList.push("secst");
                node.attributes["data-mime-type"] = type;
                node.skipContent;
                delete node.attributes.type;
            }
            node.attributes.hidden = "";
            if (node.attributes.visible == "") {
                delete node.attributes.hidden;
                delete node.attributes.visible;
            }
            if (node.attributes["data-default"] == null) {
                node.attributes["data-default"] = "";
            }
            const url = node.attributes.url || node.attributes.src;
            if(url) {
                if (node.attributes.static != null) {
                    delete node.attributes.static;
                    if(node.attributes.editable==null) {
                        node.attributes.disabled = "";
                    }
                    try {
                        const response = await fetch(url);
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
                    } catch(e) {
                        node.value = e+"";
                    }
                } else {
                    const f = `await (async () => {
                        try {
                            const response = await fetch("${url}");
                            if(response.status===200) {
                                try {
                                    let text = await response.text();
                                    if("${type}"==="application/json") {
                                        text = JSON.stringify(JSON5.parse(text), null, 2);
                                    }
                                    return text;
                                } catch(e) {
                                    return e+"";
                                }
                            } else {
                                return response.statusText;
                            }
                        } catch(e) {
                            return e+"";
                        }
                        })()`;
                    node.attributes["data-template"] = f;
                }
                delete node.attributes.url;
            } else {
                node.attributes["data-template"] = node.content.join("").trim();
                node.attributes.value = node.attributes["data-default"]
            }
            if(node.tag==="input") {
                node.content = [];
            }
            return node;
        },
        beforeMount(node) {
            if(node.attributes["data-mime-type"]) {
                node.tag = "textarea";
            } else {
                node.tag = "input";
            }
        },
        connected(el,node) {
            const value = el.getAttribute("value");
            if(node.tag==="textarea") {
                if(el.innerHTML!==value) {
                    el.innerHTML = value;
                }
                el.removeAttribute("value");
                updateValueWidths([el]);
            }
        }
    },
    video: {
        attributesAllowed: {
            src: true,
            controls: true
        },
        contentAllowed: {
            source() { return tags.source; },
            track() { return tags.track; }
        }
    }
};

for(let i=1;i<=8;i++) {
    tags["h"+i] = {
        allowAsRoot: true,
        contentAllowed: singleLineContent
    }
}

// need to reintroduce, stops tags from nesting in self
/*inlineContent.forEach((tag) => {
    if(!tags[tag]) {
        tags[tag] = {
            contentAllowed: inlineContent.filter((item) => item!==tag)
        }
    }
})*/
/*Object.entries(tags).forEach(([key,value]) => {
    value.tag = key;
    value.allowAsRoot ||= blockContent.includes(key);
})*/



export {universalAttributes, tags}
