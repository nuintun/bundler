/**
 * @module index
 */

type dependencies = string[];
type DependencyGraph = FastMap<GraphNode>;
type visitNode = (path: string, referrer: VisitedNode | null) => VisitedNode;
type drawGraphNode = (src: string, referrer: string | null) => Promise<void>;

export type oncycle = (path: string, referrer: string) => void;
export type resolve = (src: string, referrer: string) => string;
export type parse = (path: string) => void | ParseResult | Promise<void | ParseResult>;

export interface Options {
  parse: parse;
  resolve: resolve;
  oncycle?: oncycle;
  [key: string]: any;
}

export interface ParseResult {
  readonly contents?: any;
  readonly dependencies?: dependencies;
}

interface Metafile {
  readonly contents: any;
  readonly dependencies: dependencies;
}

export interface File extends Metafile {
  readonly path: string;
}

interface VisitedNode {
  readonly path: string;
  readonly value: Metafile;
  readonly referrer: VisitedNode | null;
  readonly children: IterableIterator<string>;
}

class GraphNode {
  public value!: Metafile;
  public children: Set<string> = new Set();
}

const { hasOwnProperty }: Object = Object.prototype;

class FastMap<T> {
  private map: { [key: string]: T } = Object.create(null);

  set(key: string, value: T): FastMap<T> {
    this.map[key] = value;

    return this;
  }

  get(key: string): T {
    return this.map[key];
  }

  has(key: string): boolean {
    return hasOwnProperty.call(this.map, key);
  }
}

async function readFile(path: string, parse: parse): Promise<Metafile> {
  const { contents = null, dependencies }: ParseResult = (await parse(path)) || {};

  return { contents, dependencies: Array.isArray(dependencies) ? dependencies : [] };
}

function optionsAssert(options: Options): never | Options {
  // Assert resolve and parse
  ['resolve', 'parse'].forEach((option: string) => {
    if (options && typeof options[option] !== 'function') {
      throw new TypeError(`The options.${option} must be a function`);
    }
  });

  return options;
}

function pathAssert(path: string, message: string): void | never {
  if (path && path.constructor !== String) {
    throw new TypeError(message);
  }
}

function drawDependencyGraph(input: string, options: Options): Promise<DependencyGraph> {
  return new Promise<DependencyGraph>((pResolve, pReject) => {
    let remaining: number = 0;
    let hasError: boolean = false;

    const { resolve, parse }: Options = options;
    const graph: DependencyGraph = new FastMap();

    const drawGraphNode: drawGraphNode = async (src, referrer) => {
      if (!hasError) {
        remaining++;

        try {
          const path: string = referrer !== null ? resolve(src, referrer) : src;

          // Assert path
          pathAssert(path, 'The options.resolve must be return a non empty string');

          // Add dependency path to referrer
          if (referrer !== null) {
            graph.get(referrer).children.add(path);
          }

          // Read file and parse dependencies
          if (!graph.has(path)) {
            const node: GraphNode = new GraphNode();

            graph.set(path, node);

            node.value = await readFile(path, parse);

            const { dependencies }: Metafile = node.value;

            for (const src of dependencies) {
              drawGraphNode(src, path);
            }
          }
        } catch (error) {
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

export default class Bundler {
  private options: Options;

  constructor(options: Options) {
    this.options = optionsAssert(options);
  }

  /**
   * @public
   * @method parse
   * @param {string} input
   * @description Get the list of dependent files of input file
   */
  async parse(input: string): Promise<File[]> {
    // Assert path
    pathAssert(input, 'The input must be a non empty string');

    const output: File[] = [];
    const { options }: Bundler = this;
    const visited: Set<string> = new Set();
    const waiting: Set<string> = new Set();
    const graph: DependencyGraph = await drawDependencyGraph(input, options);
    const oncycle: oncycle | null = typeof options.oncycle === 'function' ? options.oncycle : null;

    const visitNode: visitNode = (path, referrer) => {
      visited.add(path);

      oncycle && waiting.add(path);

      const { value, children }: GraphNode = graph.get(path);

      return { path, value, referrer, children: children.values() };
    };

    let current: VisitedNode | null = visitNode(input, null);

    while (current !== null) {
      const { done, value: path }: IteratorResult<string> = current.children.next();

      if (done) {
        const { path, value }: VisitedNode = current;
        const { contents, dependencies }: Metafile = value;

        oncycle && waiting.delete(path);

        output.push({ path, contents, dependencies });

        current = current.referrer;
      } else {
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
