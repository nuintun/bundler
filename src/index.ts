/**
 * @module index
 */

import { collect } from './graph';
import { assertOptions, isFunction } from './utils';
import { File, Options, VisitNode } from './interface';

export { File, Options };

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
    const graph = await collect(input, options);
    const oncycle = isFunction(options.oncycle) ? options.oncycle : null;

    const visitNode: VisitNode<T> = (path, referrer) => {
      visited.add(path);

      oncycle && waiting.add(path);

      const node = graph.get(path);

      if (node != null) {
        const { value, children } = node;

        return {
          value,
          referrer,
          children: children.values()
        };
      }
    };

    let current = visitNode(input);

    while (current != null) {
      const { done, value: path } = current.children.next();

      if (done) {
        const { path, contents, dependencies } = current.value;

        oncycle && waiting.delete(path);

        output.push({ path, contents, dependencies });

        current = current.referrer;
      } else {
        // Found circular dependency
        if (oncycle && waiting.has(path)) {
          oncycle(path, current.value.path);
        }

        if (!visited.has(path)) {
          current = visitNode(path, current);
        }
      }
    }

    return output;
  }
}
