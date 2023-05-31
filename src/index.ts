/**
 * @module index
 */

export interface OnCycle {
  (path: string, referrer: string): void;
}

export interface Resolve {
  (src: string, referrer: string): string;
}

export interface Parse<T> {
  (path: string): void | ParseResult<T> | Promise<void | ParseResult<T>>;
}

export interface Options<T> {
  parse: Parse<T>;
  resolve: Resolve;
  oncycle?: OnCycle;
}

export interface ParseResult<T> {
  readonly contents?: T;
  readonly dependencies?: string[];
}

interface Metafile<T> {
  readonly contents: T | null;
  readonly dependencies: string[];
}

export interface File<T> extends Metafile<T> {
  readonly path: string;
}

interface VisitedNode<T> {
  readonly path: string;
  readonly value: Metafile<T>;
  readonly referrer: VisitedNode<T> | null;
  readonly children: IterableIterator<string>;
}

interface DrawGraphNode {
  (src: string, referrer: string | null): Promise<void>;
}

interface VisitNode<T> {
  (path: string, referrer: VisitedNode<T> | null): VisitedNode<T>;
}

class GraphNode<T> {
  public children = new Set<string>();

  constructor(public value: Metafile<T>) {}
}

const { hasOwnProperty } = Object.prototype;

class FastMap<T> {
  private map: Record<string, T> = Object.create(null);

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

function assertOptions<T>(options?: Options<T>): never | Options<T> {
  if (!options) {
    throw new Error('The options is required');
  }

  const keys: (keyof Options<T>)[] = ['resolve', 'parse'];

  for (const key of keys) {
    // Assert resolve and parse
    if (!isFunction(options[key])) {
      throw new TypeError(`The options.${key} must be a function`);
    }
  }

  return options;
}

async function readFile<T>(path: string, parse: Parse<T>): Promise<Metafile<T>> {
  const { contents = null, dependencies } = (await parse(path)) || {};

  return { contents, dependencies: Array.isArray(dependencies) ? dependencies : [] };
}

function drawDependencyGraph<T>(input: string, options: Options<T>): Promise<FastMap<GraphNode<T>>> {
  return new Promise((pResolve, pReject) => {
    let remaining = 0;
    let hasError = false;

    const { resolve, parse } = options;
    const graph = new FastMap<GraphNode<T>>();

    const drawGraphNode: DrawGraphNode = async (src, referrer) => {
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
            const value = await readFile(path, parse);
            const node = new GraphNode<T>(value);

            graph.set(path, node);

            const { dependencies } = value;

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

export default class Bundler<T> {
  private readonly options: Options<T>;

  constructor(options: Options<T>) {
    this.options = assertOptions(options);
  }

  /**
   * @public
   * @method parse
   * @param {string} input
   * @description Get the list of dependent files of input file
   */
  async parse(input: string): Promise<File<T>[]> {
    const { options } = this;
    const output: File<T>[] = [];
    const visited = new Set<string>();
    const waiting = new Set<string>();
    const graph = await drawDependencyGraph(input, options);
    const oncycle = isFunction(options.oncycle) ? options.oncycle : null;

    const visitNode: VisitNode<T> = (path, referrer) => {
      visited.add(path);

      oncycle && waiting.add(path);

      const { value, children } = graph.get(path);

      return { path, value, referrer, children: children.values() };
    };

    let current: VisitedNode<T> | null = visitNode(input, null);

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
