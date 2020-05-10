/**
 * @module index
 */

type dependencies = string[];
type FileList = FastMap<File>;
type DependencyGraph = FastMap<Set<string>>;
type setMarked = (path: string, referer: string | null) => string;
type updateGraphNode = (referer: string | null, path: string) => void;
type drawGraphNode = (src: string, referer: string | null) => Promise<void>;
type drawDependencyGraph = (src: string, referer: string | null) => Promise<[DependencyGraph, FileList]>;

export type resolve = (src: string, referer: string) => string;
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

interface MarkedNode {
  readonly referer: string | null;
  readonly dependencies: IterableIterator<string>;
}

const { hasOwnProperty }: Object = Object.prototype;

class FastMap<T> {
  private map: { [key: string]: T } = Object.create(null);

  set(key: string, value: T): void {
    this.map[key] = value;
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

function drawDependencyGraph(input: string, options: Options): Promise<[DependencyGraph, FileList]> {
  return new Promise<[DependencyGraph, FileList]>((resolve, reject) => {
    let remaining: number = 0;
    let hasError: boolean = false;

    const files: FileList = new FastMap();
    const graph: DependencyGraph = new FastMap();

    const updateGraphNode: updateGraphNode = (referer, path) => {
      referer !== null && graph.get(referer).add(path);
    };

    const drawGraphNode: drawGraphNode = async (src, referer) => {
      if (!hasError) {
        remaining++;

        try {
          const path: string = referer !== null ? options.resolve(src, referer) : src;

          if (!graph.has(path)) {
            graph.set(path, new Set());

            updateGraphNode(referer, path);

            const file: File = await readFile(path, options.parse);

            files.set(path, file);

            for (const src of file.dependencies) {
              drawGraphNode(src, path);
            }
          } else {
            updateGraphNode(referer, path);
          }
        } catch (error) {
          hasError = true;

          return reject(error);
        }

        if (!hasError && !--remaining) {
          return resolve([graph, files]);
        }
      }
    };

    drawGraphNode(input, null);
  });
}

function assert(options: Options): never | Options {
  // Assert resolve and parse
  ['resolve', 'parse'].forEach((option: string) => {
    if (options && typeof options[option] !== 'function') {
      throw new TypeError(`The options.${option} must be a function`);
    }
  });

  return options;
}

export default class Bundler {
  private options: Options;

  constructor(options: Options) {
    this.options = assert(options);
  }

  /**
   * @public
   * @method parse
   * @param {string} input
   * @returns {Promise<File[]>}
   * @description Get the list of dependent files of input file
   */
  async parse(input: string): Promise<File[]> {
    const output: File[] = [];
    const { options }: Bundler = this;
    const waiting: Set<string> = new Set();
    const marked: FastMap<MarkedNode> = new FastMap();
    const [graph, files]: [DependencyGraph, FileList] = await drawDependencyGraph(input, options);

    const setMarked: setMarked = (path, referer) => {
      waiting.add(path);

      marked.set(path, { referer, dependencies: graph.get(path).values() });

      return path;
    };

    let current: string | null = setMarked(input, null);

    while (current !== null) {
      const node: MarkedNode = marked.get(current);
      const { done, value: path }: IteratorResult<string> = node.dependencies.next();

      if (done) {
        waiting.delete(current);

        output.push(files.get(current));

        current = marked.get(current).referer;
      } else {
        if (waiting.has(path)) {
          // Allow circularly dependency
          if (options.cycle) continue;

          // When not allowed cycle throw error
          throw new ReferenceError(`Found circularly dependency ${path} at ${current}`);
        }

        if (!marked.has(path)) {
          current = setMarked(path, current);
        }
      }
    }

    return output;
  }
}
