/**
 * @module index
 */

import { collect } from './graph';
import { assertOptions, isFunction } from './utils';
import { Current, File, GraphNode, Options } from './interface';

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
    const { oncycle } = options;
    const output: File<T>[] = [];
    const waiting: Current<T>[] = [];
    const tracing = new Set<string>();
    const visited = new Set<string>();
    const graph = await collect(input, options);
    const onFileCycle = isFunction(oncycle) ? oncycle : null;

    const getFile = (node: GraphNode<T>): File<T> => {
      const { path, contents, dependencies } = node;

      if (onFileCycle != null) {
        tracing.delete(path);
      }

      return { path, contents, dependencies };
    };

    let current: Current<T> | undefined = [[graph].values()];

    while (current) {
      const [iterator, parent] = current;
      const { done, value: node } = iterator.next();

      if (done) {
        current = waiting.pop();

        if (parent != null) {
          output.push(getFile(parent));
        }
      } else {
        const { path } = node;

        // Found circular dependency
        if (parent != null && tracing.has(path)) {
          onFileCycle?.(path, parent.path);
        }

        if (!visited.has(path)) {
          tracing.add(path);
          visited.add(path);

          const { children } = node;

          if (children.length > 0) {
            waiting.push(current);

            current = [children.values(), node];
          } else {
            output.push(getFile(node));
          }
        }
      }
    }

    return output;
  }
}
