const img = {
    attributesAllowed: {
        alt:true,
        static:true,
        height:"number",
        width:"number",
        align:["top","middle","bottom","left","right"],
        decoding:true,
        ismap:true,
        type:true,
        loading:["eager","lazy"],
        src(value) {
            new URL(value,document.baseURI);
        },
        title: "string",
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
    beforeMount(node) {
        if(node.attributes.align) {
            const styles = {
                top: "vertical-align: text-top;",
                middle: "vertical-align: -moz-middle-with-baseline;",
                bottom: "vertical-align: unset;",
                left: "float: left;",
                right: "float: right;"
            }
            node.attributes.style = styles[node.attributes.align] + (node.attributes.style||"");
        }
        return node;
    },
    toJSONLD(node) {
        if(!node.attributes.src?.startsWith("data:")) {
            return node.attributes.src
        }
    }
}


export {img,img as default}