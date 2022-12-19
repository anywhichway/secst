import fs from "fs/promises";
import url from "node:url";
import JSON5 from "json5";
import {init as initAutohelm,engage} from "@anywhichway/autohelm";
import {HighlightJS} from "highlight.js";
import { Window } from 'happy-dom';
import katex from "katex";
import mhchem from "katex/dist/contrib/mhchem.js";
import * as all from "emoji-mart";
let { init, SearchIndex } = all;
if(init==null) {
    init = all.default.init;
    SearchIndex = all.default.SearchIndex;
}

global.window = new Window(),
    global.document = window.document;
global.URL = URL;
global.fetch = async (url,...args) => {
    try {
        const response = await window.fetch((new URL(url,"http://localhost:63342/secst/")).href,...args);
        if(response.status===200) {
            return response;
        }
    } catch(e) {

    }
    return window.fetch((new URL(url, "https://sects.org/")).href,...args);
}
global.JSON5 = JSON5;
global.Text = window.Text;
global.MutationObserver = window.MutationObserver;
global.DOMParser = window.DOMParser;
global.FileReader = window.FileReader;
global.Node = window.Node;
Object.defineProperty(global.document,"baseURI",{configurable:true,writable:true,value:"http://localhost:63342/secst/"});
global.autohelm = {
    init: initAutohelm,
    engage
}
global.HighlightJS = HighlightJS;
global.katex = katex;
global.emojiMart = {
    init,
    SearchIndex
}

import peg from "pegjs";
import {transform} from "./src/transform.js";
import {resolve} from "./src/resolve.js";

const text = await fs.readFile("./index.sct",{ encoding: 'utf8' }),
    grammar = await fs.readFile("./src/grammar.txt",{ encoding: 'utf8' }),
    parser = peg.generate(grammar),
    {dom,errors,parsed,transformed} = await transform(parser,text,{styleAllowed:"*"}),
    script = document.createElement("script");
script.setAttribute("src","./runtime.js?run");
dom.head.appendChild(script);
await resolve(dom.body);
await fs.writeFile("./index.html",`<!DOCTYPE html><html><head>${dom.head.innerHTML}</head><body>${dom.body.innerHTML}</body></html>`,{ encoding: 'utf8' })
await fs.writeFile("./index.txt",text,{ encoding: 'utf8' })
console.log(errors);


