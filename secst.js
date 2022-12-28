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

const globWithCallback = (await import("glob")).default,
    glob = async (pattern) => {
        return new Promise((resolve,reject) => {
            globWithCallback(pattern,(error,files) => {
                if(error) {
                    reject(error)
                } else {
                    resolve(files);
                }
            })
        })
    };

async function getPaths(target) {
    async function* _getPaths(path = `./`) {
        const entries = await fs.readdir(path, { withFileTypes: true })
        for (let file of entries) {
            if (file.isDirectory()) {
                const fname = `${path}${file.name}/`;
                yield fname;
                yield* _getPaths(fname)
            } else {
                yield path + file.name;
            }
        }
    }
    const paths = [];
    for await(const path of _getPaths(target)) {
        paths.push(path);
    }
    return paths;
}

// this will work for file conversions at the moment, but SPD generation will require rework as a recursive function

const {transform} = await import("./src/transform.js"),
    grammar = await fs.readFile("./src/secst.peg",{ encoding: 'utf8' }),
    runtime = await fs.readFile("./runtime.js",{encoding: 'utf8'}),
    parser = peg.generate(grammar);
let [_,path,target="*.sct",...args] = process.argv;
let isdir;
try { isdir = (await fs.lstat(target)).isDirectory() } catch(e) { };
const paths = isdir ? await getPaths(target.endsWith("/") ? target : target + "/") : await glob(target);
let spd = "";
for(const path of paths) {
    if(path.endsWith(".sct")) {
        const parts = path.split("."),
            level = path.split("/").length,
            text = await fs.readFile(path,{ encoding: 'utf8' }),
            section = isdir ? `:section({level:${level}})[${text}]` : text;
        spd += section + "\n";
        const {dom,errors,parsed,transformed} = await transform(parser,section,{styleAllowed:true});
        //dom.head.appendChild(script);
        await resolve(dom.body);
        parts.pop();
        const fname = parts.join(".");
        await fs.writeFile(fname + ".html",`<!DOCTYPE html><html><head>${dom.head.innerHTML+document.head.innerHTML}<script async type="application/javascript">${runtime}</script></head><body>${dom.body.innerHTML}</body></html>`,{ encoding: 'utf8' })
        if(args.includes("--writeAsTxt")) {
            await fs.writeFile(fname + ".txt",section,{ encoding: 'utf8' })
        }
        console.log(errors);
    }
}
if(isdir) {
    const fname = target.endsWith("/") ? target.substring(0,target.length-1) : target;
    if(args.includes("--writeRootAsSCT")) {
        await fs.writeFile(fname + ".sct",spd,{encoding: 'utf8'} );
    }
    if(args.includes("--writeRootAsTxt")) {
        await fs.writeFile(fname + ".txt",spd,{encoding: 'utf8'} );
    }
    if(args.includes("--writeRootAsHTML")) {
        const {dom,errors,parsed,transformed} = await transform(parser,spd,{styleAllowed:"*"}),
            script = document.createElement("script");
        script.setAttribute("src","./runtime.js?run");
        dom.head.appendChild(script);
        await resolve(dom.body);
        await fs.writeFile(fname + ".html",`<!DOCTYPE html><html><head>${dom.head.innerHTML}</head><body>${dom.body.innerHTML}</body></html>`,{ encoding: 'utf8' })
    }
}



