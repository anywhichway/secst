import fs from "fs/promises";
import url from "node:url";

import JSON5 from "json5";
global.JSON5 = JSON5;

import {init as initAutohelm,engage} from "@anywhichway/autohelm";
global.autohelm = {
    init: initAutohelm,
    engage
}

import {HighlightJS} from "highlight.js";
global.HighlightJS = HighlightJS;

import { Window } from 'happy-dom';
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

global.Text = window.Text;
global.MutationObserver = window.MutationObserver;
global.DOMParser = window.DOMParser;
global.FileReader = window.FileReader;
global.Node = window.Node;
Object.defineProperty(global.document,"baseURI",{configurable:true,writable:true,value:"http://localhost:63342/secst/"});

import * as all from "emoji-mart";
let { init, SearchIndex } = all;
if(init==null) {
    init = all.default.init;
    SearchIndex = all.default.SearchIndex;
}
global.emojiMart = {
    init,
    SearchIndex
}

import toTagSpecs from "./src/to-tag-specs.js";
import resolveDataTemplate from "./src/resolve-data-template.js";


global.SECST = {
    resolveDataTemplate,
    tagSpecs: await (async () => {
        const {allTags} = await import("./src/tags/all-tags.js");
        const specs = await toTagSpecs(allTags);
        //console.log(JSON.stringify(specs))
        return await toTagSpecs(allTags);
    })()
}

import peg from "pegjs";
import {resolve} from "./src/resolve.js";

const {transform} = await import("./src/transform.js"),
    text = await fs.readFile("./index.sct",{ encoding: 'utf8' }),
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


