import JSON5 from "json5";
import Person from "./person.js";

const headline = {
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
        return node;
    }
}

const datePublished = {
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
            formatted = new Intl.DateTimeFormat(lang,options).format(new Date(node.content.join(":")));
        return formatted;
    }
}

const author = {
    contentAllowed: {
        name: {
            contentAllowed: true,
            toJSONLD(node) {
                node.classList.push("JSON-LD-author-name");
                return {name:node.content.join("")}
            },
            beforeMount(node) {
                node.tag = "span";
                return node;
            }
        },
        Person
    },
    beforeMount(node) {
        node.tag = "span";
        return node;
    },
    minCount: 1,
    toJSONLD(node) {
        const author = node.getContentByTagName("name")[0] || node.getContentByTagName("Person")[0];
        if(author) return author.toJSONLD(author);
    }
}

const NewsArticle = {
    async contentAllowed() {
        const {blockContent} = await import("../block-content.js");
        this.contentAllowed = {
            author,
            ...blockContent,
            datePublished,
            headline
        }
        delete this.contentAllowed.NewsArticle;
        return this.contentAllowed;
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
        //console.log(jsonld);
    },
    beforeMount(node) {
        node.tag = "div";
        return node;
    }

}

export {NewsArticle, NewsArticle as default}