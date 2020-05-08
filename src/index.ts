/**
 * @module index
 */

export interface ParseResult {
  readonly contents?: any;
  readonly dependencies?: string[] | Set<string>;
}

export interface Metadata {
  readonly path: string;
  readonly contents: any;
  readonly dependencies: Set<string>;
}

interface File {
  readonly path: string;
  readonly referer?: File;
  readonly metadata: Metadata;
  readonly dependencies: IterableIterator<string>;
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

  let dependencies: Set<string>;

  if (deps instanceof Set) {
    dependencies = deps;
  } else if (Array.isArray(deps)) {
    dependencies = new Set(deps);
  } else {
    dependencies = new Set<string>();
  }

  const metadata: Metadata = { path, contents, dependencies };

  return { path, referer, metadata, dependencies: dependencies.values() };
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
  async parse(input: string): Promise<Set<Metadata>> {
    const waiting: Set<string> = new Set<string>();
    const completed: Set<string> = new Set<string>();
    const metadata: Set<Metadata> = new Set<Metadata>();
    const { cycle, resolve, parse }: Options = this.options;

    waiting.add(input);

    let current: File | undefined = await readFile(input, parse);

    while (current) {
      const { done, value }: IteratorResult<string> = current.dependencies.next();

      if (done) {
        const { path }: File = current;

        waiting.delete(path);
        metadata.add(current.metadata);
        completed.add(path);

        current = current.referer;
      } else {
        const path: string = await resolve(value, current.path);

        if (waiting.has(path)) {
          // Allow circularly dependency
          if (cycle) continue;

          // When not allowed cycle throw error
          throw new ReferenceError(`Found circularly dependency ${value} at ${current.path}`);
        } else if (!completed.has(path)) {
          waiting.add(path);

          current = await readFile(path, parse, current);
        }
      }
    }

    return metadata;
  }
}
