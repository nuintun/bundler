/**
 * @module index
 */

export interface ParseResult {
  readonly contents?: any;
  readonly dependencies?: string[];
}

export interface Metadata {
  readonly path: string;
  readonly contents: any;
  readonly dependencies: string[];
}

interface File {
  readonly path: string;
  readonly referer?: File;
  readonly metadata: Metadata;
  readonly dependencies: IterableIterator<[number, string]>;
}

type parse = (path: string) => ParseResult;
type resolve = (src: string, referer: string) => string;

interface Options {
  parse: parse;
  cycle?: boolean;
  resolve: resolve;
  [key: string]: any;
}

async function readFile(path: string, parse: parse, referer?: File): Promise<File> {
  const { contents, dependencies: deps }: ParseResult = await parse(path);
  const dependencies: string[] = Array.isArray(deps) ? deps : [];
  const metadata: Metadata = { path, contents, dependencies };

  return { path, referer, metadata, dependencies: dependencies.entries() };
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
  async parse(input: string): Promise<Metadata[]> {
    const metadata: Metadata[] = [];
    const waiting: Set<string> = new Set<string>();
    const completed: Set<string> = new Set<string>();
    const { cycle, resolve, parse }: Options = this.options;

    waiting.add(input);

    let current: File | undefined = await readFile(input, parse);

    while (current) {
      const { done, value: entry }: IteratorResult<[number, string]> = current.dependencies.next();

      if (done) {
        const { path }: File = current;

        metadata.push(current.metadata);

        waiting.delete(path);

        completed.add(path);

        current = current.referer;
      } else {
        const [, src]: [number, string] = entry;
        const path: string = await resolve(src, current.path);

        if (waiting.has(path)) {
          // Allow circularly dependency
          if (cycle) continue;

          // When not allowed cycle throw error
          throw new ReferenceError(`Found circularly dependency ${src} at ${current.path}`);
        } else if (!completed.has(path)) {
          waiting.add(path);

          current = await readFile(path, parse, current);
        }
      }
    }

    return metadata;
  }
}
