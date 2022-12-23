import footer from "./footer.js";
import header from "./header.js";
import toc from "./toc.js";


const sectioningContent = {
    async article() {
        const {article} = await import("./article.js");
        return this.article = article;
    },
    footer,
    header,
    async NewsArticle() {
        const {NewsArticle} = await import("./json-ld/news-article.js");
        return this.article = NewsArticle;
    },
    async section() {
        const {section} = await import("./section.js");
        return this.section = section;
    },
    toc
}

export {sectioningContent,sectioningContent as default}
