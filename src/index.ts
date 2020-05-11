/**
 * @module index
 */

type dependencies = string[];
type DependencyGraph = FastMap<GraphNode>;
type setMark = (path: string, referrer: MarkNode | null) => MarkNode;
type drawGraphNode = (src: string, referrer: string | null) => Promise<void>;

export type resolve = (src: string, referrer: string) => string;
export type parse = (path: string) => void | ParseResult | Promise<void | ParseResult>;

export interface Options {
  parse: parse;
  cycle?: boolean;
  resolve: resolve;
  [key: string]: any;
}

export interface ParseResult {
  readonly contents?: any;
  readonly dependencies?: dependencies;
}

export interface File {
  readonly path: string;
  readonly contents: any;
  readonly dependencies: dependencies;
}

interface MarkNode {
  readonly path: string;
  readonly contents: any;
  readonly referrer: MarkNode | null;
  readonly dependencies: dependencies;
  readonly references: IterableIterator<string>;
}

class GraphNode {
  public contents: any;
  public dependencies: dependencies;
  public references: Set<string> = new Set();

  constructor(public path: string) {}
}

const { hasOwnProperty }: Object = Object.prototype;

class FastMap<T> {
  public map: { [key: string]: T } = Object.create(null);

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

async function readFile(path: string, parse: parse): Promise<File> {
  const { contents = null, dependencies }: ParseResult = (await parse(path)) || {};

  return { path, contents, dependencies: Array.isArray(dependencies) ? dependencies : [] };
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
            graph.get(referrer).references.add(path);
          }

          // Read file and parse dependencies
          if (!graph.has(path)) {
            const node: GraphNode = new GraphNode(path);

            graph.set(path, node);

            const { contents, dependencies }: File = await readFile(path, parse);

            node.contents = contents;
            node.dependencies = dependencies;

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
    pathAssert(input, 'The input must be return a non empty string');

    const output: File[] = [];
    const { options }: Bundler = this;
    const marked: Set<string> = new Set();
    const waiting: Set<string> = new Set();
    const acyclic: boolean = !options.cycle;

    const graph: DependencyGraph = await drawDependencyGraph(input, options);

    const setMark: setMark = (path, referrer) => {
      marked.add(path);

      acyclic && waiting.add(path);

      const { contents, dependencies, references }: GraphNode = graph.get(path);

      return { path, referrer, contents, dependencies, references: references.values() };
    };

    let current: MarkNode | null = setMark(input, null);

    while (current !== null) {
      const { done, value: path }: IteratorResult<string> = current.references.next();

      if (done) {
        const { path, contents, dependencies }: MarkNode = current;

        acyclic && waiting.delete(path);

        output.push({ path, contents, dependencies });

        current = current.referrer;
      } else {
        if (acyclic && waiting.has(path)) {
          // When not allowed cycle throw error
          throw new ReferenceError(`Found circularly dependency ${path} at ${current.path}`);
        }

        if (!marked.has(path)) {
          current = setMark(path, current);
        }
      }
    }

    return output;
  }
}
