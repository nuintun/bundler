/**
 * @module index
 */

interface AnalysisResults {
  readonly contents?: any;
  readonly dependencies: string[] | Set<string>;
}

interface Metadata {
  readonly path: string;
  readonly contents: any;
  readonly dependencies: Set<string>;
}

type parse = (path: string) => AnalysisResults;
type resolve = (src: string, referer: string) => string;

interface Options {
  parse: parse;
  cycle?: boolean;
  resolve: resolve;
  [key: string]: any;
}

interface File {
  readonly path: string;
  readonly referer?: File;
  readonly metadata: Metadata;
  readonly dependencies: IterableIterator<string>;
}

async function readFile(path: string, parse: parse, referer?: File): Promise<File> {
  const { contents, dependencies: deps }: AnalysisResults = await parse(path);

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

function assert(options: Options): void | never {
  // Assert resolve and parse
  ['resolve', 'parse'].forEach((name: string) => {
    if (options && typeof options[name] !== 'function') {
      throw new TypeError(`The options.${name} must be a function`);
    }
  });
}

export default class Bundler {
  private input: string;
  private options: Options;
  private completed: Set<string> = new Set<string>();
  private metadata: Set<Metadata> = new Set<Metadata>();
  private waiting: Map<string, File> = new Map<string, File>();

  constructor(input: string, options: Options) {
    assert(options);

    this.input = input;
    this.options = options;
  }

  async pack(): Promise<Set<Metadata>> {
    const { input, options, waiting, completed, metadata }: Bundler = this;
    const { resolve, parse }: Options = options;

    let current: File | undefined = await readFile(input, parse);

    waiting.set(input, current);

    while (current) {
      if (completed.has(current.path)) {
        current = current.referer;
      } else {
        const { done, value }: IteratorResult<string> = current.dependencies.next();

        if (done) {
          console.log(current.path, current.referer?.path);
          waiting.delete(current.path);
          completed.add(current.path);
          metadata.add(current.metadata);

          current = current.referer;
        } else {
          const path: string = await resolve(value, current.path);

          if (waiting.has(path)) {
            current = waiting.get(path);
          } else {
            current = await readFile(path, parse, current);

            waiting.set(path, current);
          }
        }
      }
    }

    return metadata;
  }
}
