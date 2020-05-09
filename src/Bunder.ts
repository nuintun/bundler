/**
 * @module Bunder
 */

type dependencies = string[];

export interface ParseResult {
  readonly contents?: any;
  readonly dependencies?: dependencies;
}

interface File {
  readonly path: string;
  readonly contents: any;
  readonly dependencies: dependencies;
}

interface MarkedNode {
  readonly referer: string | null;
  readonly dependencies: IterableIterator<string>;
}

type FileList = Map<string, File>;
type DependencyNode = Set<string>;
type DependencyGraph = Map<string, DependencyNode>;
type updateRefererNode = (path: string, referer?: string) => void;
type drawDependencyGraph = (src: string, referer?: string) => Promise<void>;

export type resolve = (src: string, referer: string) => string;
export type parse = (path: string) => ParseResult | Promise<ParseResult | void> | void;

export interface Options {
  parse: parse;
  cycle?: boolean;
  resolve: resolve;
  [key: string]: any;
}

async function readFile(path: string, parse: parse): Promise<File> {
  const { contents = null, dependencies }: ParseResult = (await parse(path)) || {};

  return { path, contents, dependencies: Array.isArray(dependencies) ? dependencies : [] };
}

function drawDependencyGraph(input: string, options: Options): Promise<[DependencyGraph, FileList]> {
  return new Promise<[DependencyGraph, FileList]>((resolve, reject) => {
    let remaining: number = 0;
    let hasError: boolean = false;

    const files: FileList = new Map();
    const graph: DependencyGraph = new Map();

    const updateRefererNode: updateRefererNode = (path, referer) => {
      referer && (graph.get(referer) as DependencyNode).add(path);
    };

    const drawDependencyGraph: drawDependencyGraph = async (src, referer) => {
      try {
        if (!hasError) {
          remaining++;

          const path: string = referer ? await options.resolve(src, referer) : src;

          if (!graph.has(path)) {
            graph.set(path, new Set());

            updateRefererNode(path, referer);

            const file: File = await readFile(path, options.parse);

            files.set(path, file);

            for (const src of file.dependencies) {
              drawDependencyGraph(src, path);
            }
          } else {
            updateRefererNode(path, referer);
          }

          remaining--;

          if (!remaining) {
            resolve([graph, files]);
          }
        }
      } catch (error) {
        hasError = true;

        reject(error);
      }
    };

    drawDependencyGraph(input);
  });
}

function assert(options: Options): Options | never {
  // Assert resolve and parse
  ['resolve', 'parse'].forEach((option: string) => {
    if (options && typeof options[option] !== 'function') {
      throw new TypeError(`The options.${option} must be a function`);
    }
  });

  return options;
}

type setMarkedNode = (path: string, referer?: string | null) => void;

export default class Bundler {
  private options: Options;

  constructor(options: Options) {
    this.options = assert(options);
  }

  /**
   * @public
   * @method parse
   * @param {string} input
   * @description
   * @returns {Promise<Set<Metadata>>}
   */
  async parse(input: string): Promise<File[]> {
    const output: File[] = [];
    const { options }: Bundler = this;
    const waiting: Set<string> = new Set<string>();
    const marked: Map<string, MarkedNode> = new Map();
    const [graph, files]: [DependencyGraph, FileList] = await drawDependencyGraph(input, options);

    console.log(graph);

    const setMarkedNode: setMarkedNode = (path, referer = null) => {
      marked.set(path, { referer, dependencies: (graph.get(path) as DependencyNode).values() });
    };

    let current: string | null = input;

    waiting.add(current);

    setMarkedNode(current);

    console.time('graph');

    while (current) {
      const node: MarkedNode = marked.get(current) as MarkedNode;
      const { done, value }: IteratorResult<string> = node.dependencies.next();

      if (done) {
        waiting.delete(current);

        output.push(files.get(current) as File);

        current = (marked.get(current) as MarkedNode).referer;
      } else {
        if (waiting.has(value)) {
          // Allow circularly dependency
          if (options.cycle) continue;

          // When not allowed cycle throw error
          throw new ReferenceError(`Found circularly dependency ${value} at ${current}`);
        } else if (!marked.has(value)) {
          waiting.add(value);

          setMarkedNode(value, current);

          current = value;
        }
      }
    }

    console.timeEnd('graph');

    return output;
  }
}
