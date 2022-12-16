import textContent from "./text-content.js";

const a = {
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
        target: "string",
        type(value) {
            const parts = value.split("/");
            if(parts.length!==2 || parts[0].length<1 || parts[1].length<1) {
                throw new TypeError(`${value} is not a valid MIME type`)
            }
        }
    },
    contentAllowed: {...textContent},
    transform(node) {
        let href = node.attributes.url || node.attributes.href;
        if(!href) {
            href = node.attributes.href = (node.content[0]||"").trim();
        }
        if(href) {
            new URL(href,document?.baseURI);
            if(!node.attributes.target && !href.startsWith(".") && !href.startsWith("#")) {
                node.attributes.target = "_tab";
            }
        }
        return node;
    }
}
delete a.contentAllowed.a;

export {a,a as default}