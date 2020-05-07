"use strict";
/**
 * @module index
 */
Object.defineProperty(exports, "__esModule", { value: true });
async function readFile(path, parse, referer) {
    const { contents, dependencies: deps } = await parse(path);
    let dependencies;
    if (deps instanceof Set) {
        dependencies = deps;
    }
    else if (Array.isArray(deps)) {
        dependencies = new Set(deps);
    }
    else {
        dependencies = new Set();
    }
    const metadata = { path, contents, dependencies };
    return { path, referer, metadata, dependencies: dependencies.values() };
}
function assert(options) {
    // Assert resolve and parse
    ['resolve', 'parse'].forEach((name) => {
        if (options && typeof options[name] !== 'function') {
            throw new TypeError(`The options.${name} must be a function`);
        }
    });
}
class Bundler {
    constructor(input, options) {
        this.waiting = new Set();
        this.completed = new Set();
        this.metadata = new Set();
        assert(options);
        this.input = input;
        this.options = options;
    }
    async pack() {
        const { input, options, waiting, completed, metadata } = this;
        const { resolve, parse } = options;
        waiting.add(input);
        let current = await readFile(input, parse);
        while (current) {
            if (completed.has(current.path)) {
                current = current.referer;
            }
            else {
                const { done, value } = current.dependencies.next();
                if (done) {
                    console.log(current.path, current.referer?.path);
                    waiting.delete(current.path);
                    completed.add(current.path);
                    metadata.add(current.metadata);
                    current = current.referer;
                }
                else {
                    const path = await resolve(value, current.path);
                    if (!waiting.has(path)) {
                        waiting.add(path);
                        current = await readFile(path, parse, current);
                    }
                }
            }
        }
        return metadata;
    }
}
exports.default = Bundler;
