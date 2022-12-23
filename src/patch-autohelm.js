const patchAutohelm = () => {
    document.body.addEventListener("click",(event) => {
        const anchors = [...document.body.querySelectorAll(`.autohelm-toc a[href]`)];
        if(anchors.includes(event.target)) {
            const {top,left,height} = document.getElementById("secst-content").getBoundingClientRect();
            const toc = document.body.querySelector(".autohelm-toc-popup");
            if (toc) {
                toc.style.maxHeight = height+"px";
                toc.style.height = "unset";
                toc.firstElementChild.style.maxHeight = (height-30)+"px";
                toc.style.top = (top + 10) + "px";
            }
        }
    })
}

export {patchAutohelm, patchAutohelm as default}