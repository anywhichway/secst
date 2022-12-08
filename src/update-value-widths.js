const updateValueWidths = (els) => {
    // not targetted to a specific element because dependency calcs may have updated many
    if(typeof(requestAnimationFrame)==="function") {
        requestAnimationFrame(() => {
            els ||= [...document.querySelectorAll('input[data-fitcontent]'),...document.querySelectorAll('textarea[data-fitcontent]')];
            [...els].forEach((el) => {
                if(el.tagName==="input") {
                    const value = el.getAttribute("value")||"";
                    el.style.width = Math.max(1,value.length+1)+"ch";
                } else if(el.tagName==="TEXTAREA") {
                    const value = el.innerHTML || el.innerText;
                    if(value) {
                        const lines = value.split("\n");
                        el.style.height = (Math.min(20, lines.length) * 1.5) + "em";
                        el.style.width = (lines.reduce((len, line) => Math.max(len, line.length), 0) + 2) + "ch";
                    }
                }
                el.style.maxWidth = document.body.getBoundingClientRect().width + "px";
            });
        })
    }
}

export {updateValueWidths}