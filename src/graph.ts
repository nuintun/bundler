/**
 * @module graph
 */

import { File, GraphNode, Options, Parse, ProcessFile } from './interface';

async function readFile<T>(path: string, parse: Parse<T>): Promise<File<T>> {
  const parsed = await parse(path);
  const { contents = null, dependencies } = parsed || {};

  return { path, contents, dependencies: Array.isArray(dependencies) ? dependencies : [] };
}

export async function collect<T>(input: string, { resolve, parse }: Options<T>): Promise<Map<string, GraphNode<T>>> {
  const visited = new Set<string>();
  const graph = new Map<string, GraphNode<T>>();

  const processFile: ProcessFile<T> = async path => {
    if (!visited.has(path)) {
      visited.add(path);

      // Read file and parse dependencies
      const file = await readFile(path, parse);

      // Get graph node
      const node: GraphNode<T> = {
        value: file,
        children: await Promise.all(
          file.dependencies.map(src => {
            return resolve(src, path);
          })
        )
      };

      // Process children
      await Promise.all(
        node.children.map(path => {
          return processFile(path);
        })
      );

      graph.set(path, node);
    }

    return graph;
  };

  const path = await resolve(input);

  return processFile(path);
}
