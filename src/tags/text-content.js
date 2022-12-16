import value from "./value.js";

const textContent = {
    async a() { const {a} = await import("./a.js"); return this.a = a; },
    async abbr() { const {abbr} = await import("./abbr.js"); return this.abbr = abbr; },
    async code() { const {code} = await import("./code.js"); return this.code = code; },
    async del() { const {del} = await import("./del.js"); return this.del = del; },
    async em() { const {em} = await import("./em.js"); return this.em = em; },
    async ins() { const {ins} = await import("./ins.js"); return this.ins = ins; },
    async kbd() { const {kbd} = await import("./kbd.js"); return this.kbd = kbd; },
    async mark() { const {mark} = await import("./mark.js"); return this.mark = mark; },
    async pre() { const {pre} = await import("./pre.js"); return this.pre = pre; },
    async q() { const {q} = await import("./q.js"); return this.q = q; },
    async samp() { const {samp} = await import("./samp.js"); return this.samp = samp; },
    async strike() { const {strike} = await import("./strike.js"); return this.strike = strike; },
    async strong() { const {strong} = await import("./strong.js"); return this.strong = strong; },
    async sub() { const {sub} = await import("./sub.js"); return this.sub = sub; },
    async sup() { const {sup} = await import("./sup.js"); return this.sup = sup; },
    async u() { const {u} = await import("./u.js"); return this.u = u; },
    var: {
        async contentAllowed() {
            const textContent = await import("./text-content.js");
            delete textContent.var;
            return textContent;
        }
    }
}

export {textContent, textContent as default}