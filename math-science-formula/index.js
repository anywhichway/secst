//const self = window.currentComponent(import.meta.url);
let promise = Promise.resolve();

self.properties({
    render() {
        const open = this.style.display==="block" ? "[" : "(",
            close = this.style.display==="block" ? "]" : ")";
        this.shadowRoot.innerHTML =
            '<mjx-doc><mjx-head></mjx-head><mjx-body>\\' + open + this.innerHTML + '\\' + close + '</mjx-body></mjx-doc>';
        try {
           // MathJax.typesetShadow(this.shadowRoot);
            promise.then(() => MathJax.typesetShadowPromise(this.shadowRoot))
                .catch((e) => console.log(e));
        } catch(e) {
            console.log(e);
        }
        this.setAttribute("title",this.textContent);
    }
});


