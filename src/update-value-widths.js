const updateValueWidths = (els) => {
    // not targetted to a specific element because dependency calcs may have updated many
    if(typeof(requestAnimationFrame)==="function") {
        requestAnimationFrame(() => {
            els ||= [...document.querySelectorAll('[data-fitcontent]')];
            [...els].forEach((el) => {
                if(el.tagName==="TEXTAREA") {
                    const value = el.innerHTML || el.innerText || el.value;
                    if(value) {
                        const lines = value.split("\n"),
                            height = Math.round((Math.min(20, lines.length-1) * 1.5));
                        el.style.height = (height < 3 ? 3 : (height < 4 ? 5 : height)) + "em";
                        el.style.width = (lines.reduce((len, line) => Math.max(len, line.length), 0) + 2) + "ch";
                    }
                } else {
                    const value = el.getAttribute("value")||"",
                        pad = el.hasAttribute("readonly") || el.hasAttribute("disabled") ? 0 : 1;
                    el.style.width = Math.max(1,value.length+pad)+"ch";
                }
                //el.style.maxWidth = document.body.getBoundingClientRect().width + "px";
            });
        })
    }

}

export {updateValueWidths}