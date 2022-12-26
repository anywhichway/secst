function css_sanitize(css) {
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.style.width = "10px";
    iframe.style.height = "10px";
    document.body.appendChild(iframe);
    const style = iframe.contentDocument.createElement('style');
    style.innerHTML = css;
    iframe.contentDocument.head.appendChild(style);
    const result = Array.from(style.sheet.cssRules).map(rule => rule.cssText || '').join('\n');
    iframe.remove();
    return result;
}

self.properties({
    initialize() {
        this.addEventListener("keydown",(event) => {
           // event.stopImmediatePropagation();
        })
    },
    connected() {
        //this.setAttribute("contenteditable","false");
        //this.cursor = document.createElement("cursor");
        const iframe = this.shadowRoot.querySelector("iframe");
        [...this.shadowRoot.querySelectorAll("pre code[slot]")].forEach((textarea) => {
            textarea.addEventListener("beforeinput",() => {
                textarea.previousTextContent = textarea.textContent;
            })
            textarea.addEventListener("input",(event) => {
                event.stopImmediatePropagation();
                const slotname = textarea.getAttribute("slot");
                if(slotname==="css") {
                    //textarea.normalize();
                    // textarea.innerText =  css_sanitize(textarea.textContent); // started breaking in v8, not sure why
                }
                const {target,currentTarget} = event,
                    slot = this.querySelector(`slot[name="${slotname}"]`);
                if(slotname==="script") {
                    try {
                        iframe.contentWindow.eval(target.textContent);
                    } catch(e) {
                        iframe.contentWindow.console.error(e+"");
                    }
                }
                slot.innerText = currentTarget.editor.getValue();
                this.render();
            });
            textarea.addEventListener("paste",(event) => {
                event.stopImmediatePropagation();
            })
            textarea.addEventListener("click",(event) => {
                event.stopImmediatePropagation();
            })
        });
        let lastError;
        if(iframe.contentWindow) {
            const console = iframe.contentWindow.console = this.shadowRoot.querySelector("div.console"),
                log = (color,...args) => {
                    const div = iframe.contentDocument.createElement("div");
                    div.style.color = color;
                    args.forEach((arg) => {
                        const span = iframe.contentDocument.createElement("span");
                        if(arg && typeof(arg)==="object") {
                            try {
                                span.innerText = JSON.stringify(arg);
                            } catch (e) {
                                span.innerText = arg;
                            }
                        } else {
                            span.innerText = arg;
                        }
                        div.appendChild(span);
                    });
                    console.appendChild(div);
                };
            console.log = (...args) => log("black",...args);
            console.warn = (...args) => log("orange",...args);
            console.error = (arg) => {
                if(arg+""===lastError) return;
                lastError = arg+"";
                log("red",arg);
            }
            console.clear = () => console.innerHTML = "";
        }
    },
    render() {
        const iframe = this.shadowRoot.querySelector("iframe"),
            slots = {
                head: this.querySelector('slot[name="head"]'),
                css: this.querySelector('slot[name="css"]'),
                body: this.querySelector('slot[name="body"]'),
                script: this.querySelector('slot[name="script"]')
            },
            readonly = this.hasAttribute("readonly") && this.getAttribute("readonly")!=="false" ? true : false,
            lineNumbers = this.hasAttribute("linenumbers") && this.getAttribute("linenumbers")!=="false" ? true : false,
            style = this.getAttribute("replstyle");
        ["allow","allowfullscren","allowpaymentrequest","csp","sandbox"].forEach((name) => {
            const value = this.getAttribute(name);
            if(value!=null) iframe.setAttribute(name,value)
        });
        iframe.contentWindow?.console?.clear();
        Object.entries(slots).forEach(([key,el],index) => {
            const hasSlot = this.hasAttribute(key) ? this.getAttribute(key)||true : "false";
            if(!el) {
                el = slots[key] = document.createElement("slot");
                el.setAttribute("name",key);
                this.appendChild(el);
            }
            const slot = this.shadowRoot.querySelector(`[slot="${key}"]`);
            if(hasSlot==="false") {
                slot.style.display = "none";
            }
            slot.setAttribute("spellcheck","false");
            if(el?.hasAttribute("hidden") ? el.getAttribute("hidden")!=="false" : hasSlot==="hidden") {
                slot.style.display = "none";
                slot.parentElement.style.display = "none";
            } else {
                slot.parentElement.style.display = "";
            }
            if(!slot.editor) {
                slot.editor ||= CodeMirror(slot,{
                    lineNumbers: el?.hasAttribute("linenumbers") ? el.getAttribute("linenumbers")!=="false" :  lineNumbers,
                    readOnly: (el?.hasAttribute("readonly") ? el.getAttribute("readonly")!=="false" : hasSlot==="readonly" || readonly) ? "nocursor" : false,
                    value:el  && hasSlot!=="false" ? el.textContent : "",
                    mode: key==="body"||key==="head" ? "htmlmixed" : (key==="script" ? "javascript" : "css"),
                    placeholder: key + "..."
                });
                slot.editor.on("change",() => {
                    this.render();
                });
                const editors = [...this.shadowRoot.querySelectorAll(".CodeMirror")];
                editors[index].style.resize = "vertical";
                editors[index].style.height = "10em";
                if(style||el?.hasAttribute("style")) {
                    editors[index].setAttribute("style",(style||"")+";"+(el?.getAttribute("style")||""));
                }

            }
            if(hasSlot==="false") {
                slot.parentElement.style.display = "none";
            } else if(hasSlot==="readonly" || hasSlot==="disabled") {
                slot.setAttribute("readonly","");
                slot.setAttribute("disabled","");
            } else if(hasSlot==="hidden") {
                slot.parentElement.style.display = "none";
            }
        })
        iframe.contentDocument.head.innerHTML = "";
        if(slots.head) {
            const head = this.shadowRoot.querySelector('[slot="head"]');
            iframe.contentDocument.head.innerHTML = head.editor.getValue();
        }
        if(slots.css) {
            const css = this.shadowRoot.querySelector('[slot="css"]'),
                style = document.createElement("style");
            style.innerText = css.editor.getValue();
            iframe.contentDocument.head.appendChild(style);
        }
        iframe.contentDocument.body.innerHTML = "";
        if(slots.body) {
            const body = this.shadowRoot.querySelector('[slot="body"]');
            [...slots.body.attributes].forEach((attr) => {
                if(attr.name!=="name") iframe.contentDocument.body.setAttribute(attr.name,attr.value);
            });
            iframe.contentDocument.body.innerHTML = body.editor.getValue();
        }
        if(slots.script) {
            const script = this.shadowRoot.querySelector('[slot="script"]'),
                _script = document.createElement("script");
            [...slots.script.attributes].forEach((attr) => {
                if(attr.name!=="name") script.setAttribute(attr.name,attr.value);
            });
            _script.innerHTML = script.editor.getValue();
            iframe.contentDocument.body.appendChild(_script);
        }
        this.shadowRoot.querySelector(".repl").style.display = "block"; // this sometimes gets set to none by quickComponent and timing issues prevent it from being removed
    }
})



