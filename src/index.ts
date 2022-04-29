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
  public children = new Set<string>();
}

const { hasOwnProperty } = Object.prototype;

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

function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

function assertOptions(options?: Options): never | Options {
  if (!options) {
    throw new Error('The options is required');
  }

  const keys: (keyof Options)[] = ['resolve', 'parse'];

  for (const key of keys) {
    // Assert resolve and parse
    if (!isFunction(options[key])) {
      throw new TypeError(`The options.${key} must be a function`);
    }
  }

  return options;
}

async function readFile(path: string, parse: parse): Promise<Metafile> {
  const { contents = null, dependencies } = (await parse(path)) || {};

  return { contents, dependencies: Array.isArray(dependencies) ? dependencies : [] };
}

function drawDependencyGraph(input: string, options: Options): Promise<DependencyGraph> {
  return new Promise<DependencyGraph>((pResolve, pReject) => {
    let remaining = 0;
    let hasError = false;

    const { resolve, parse } = options;
    const graph = new FastMap<GraphNode>();

    const drawGraphNode: drawGraphNode = async (src, referrer) => {
      if (!hasError) {
        remaining++;

        try {
          const path = referrer !== null ? resolve(src, referrer) : src;

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
  private readonly options: Options;

  constructor(options: Options) {
    this.options = assertOptions(options);
  }

  /**
   * @public
   * @method parse
   * @param {string} input
   * @description Get the list of dependent files of input file
   */
  async parse(input: string): Promise<File[]> {
    const { options } = this;
    const output: File[] = [];
    const visited = new Set<string>();
    const waiting = new Set<string>();
    const graph = await drawDependencyGraph(input, options);
    const oncycle = isFunction(options.oncycle) ? options.oncycle : null;

    const visitNode: visitNode = (path, referrer) => {
      visited.add(path);

      oncycle && waiting.add(path);

      const { value, children } = graph.get(path);

      return { path, value, referrer, children: children.values() };
    };

    let current: VisitedNode | null = visitNode(input, null);

    while (current !== null) {
      const { done, value: path }: IteratorResult<string, string> = current.children.next();

      if (done) {
        const { path, value } = current;
        const { contents, dependencies } = value;

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
