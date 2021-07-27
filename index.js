/**
 * @module @nuintun/bundler
 * @license MIT
 * @version 3.0.2
 * @author nuintun
 * @description An async file dependency bundle parser.
 * @see https://github.com/nuintun/bundler#readme
 */

'use strict';

/**
 * @module index
 */
class GraphNode {
    value;
    children = new Set();
}
const { hasOwnProperty } = Object.prototype;
class FastMap {
    map = Object.create(null);
    set(key, value) {
        this.map[key] = value;
        return this;
    }
    get(key) {
        return this.map[key];
    }
    has(key) {
        return hasOwnProperty.call(this.map, key);
    }
}
async function readFile(path, parse) {
    const { contents = null, dependencies } = (await parse(path)) || {};
    return { contents, dependencies: Array.isArray(dependencies) ? dependencies : [] };
}
function optionsAssert(options) {
    // Assert resolve and parse
    ['resolve', 'parse'].forEach((option) => {
        if (options && typeof options[option] !== 'function') {
            throw new TypeError(`The options.${option} must be a function`);
        }
    });
    return options;
}
function pathAssert(path, message) {
    if (path && path.constructor !== String) {
        throw new TypeError(message);
    }
}
function drawDependencyGraph(input, options) {
    return new Promise((pResolve, pReject) => {
        let remaining = 0;
        let hasError = false;
        const { resolve, parse } = options;
        const graph = new FastMap();
        const drawGraphNode = async (src, referrer) => {
            if (!hasError) {
                remaining++;
                try {
                    const path = referrer !== null ? resolve(src, referrer) : src;
                    // Assert path
                    pathAssert(path, 'The options.resolve must be return a non empty string');
                    // Add dependency path to referrer
                    if (referrer !== null) {
                        graph.get(referrer).children.add(path);
                    }
                    // Read file and parse dependencies
                    if (!graph.has(path)) {
                        const node = new GraphNode();
                        graph.set(path, node);
                        node.value = await readFile(path, parse);
                        const { dependencies } = node.value;
                        for (const src of dependencies) {
                            drawGraphNode(src, path);
                        }
                    }
                }
                catch (error) {
                    hasError = true;
                    return pReject(error);
                }
                if (!hasError && !--remaining) {
                    return pResolve(graph);
                }
            }
        };
        drawGraphNode(input, null);
    });
}
class Bundler {
    options;
    constructor(options) {
        this.options = optionsAssert(options);
    }
    /**
     * @public
     * @method parse
     * @param {string} input
     * @description Get the list of dependent files of input file
     */
    async parse(input) {
        // Assert path
        pathAssert(input, 'The input must be a non empty string');
        const output = [];
        const { options } = this;
        const visited = new Set();
        const waiting = new Set();
        const graph = await drawDependencyGraph(input, options);
        const oncycle = typeof options.oncycle === 'function' ? options.oncycle : null;
        const visitNode = (path, referrer) => {
            visited.add(path);
            oncycle && waiting.add(path);
            const { value, children } = graph.get(path);
            return { path, value, referrer, children: children.values() };
        };
        let current = visitNode(input, null);
        while (current !== null) {
            const { done, value: path } = current.children.next();
            if (done) {
                const { path, value } = current;
                const { contents, dependencies } = value;
                oncycle && waiting.delete(path);
                output.push({ path, contents, dependencies });
                current = current.referrer;
            }
            else {
                // Found circular dependency
                if (oncycle && waiting.has(path)) {
                    oncycle(path, current.path);
                }
                if (!visited.has(path)) {
                    current = visitNode(path, current);
                }
            }
        }
        return output;
    }
}

module.exports = Bundler;
