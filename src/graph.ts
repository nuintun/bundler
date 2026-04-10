/**
 * @module graph
 */

import { File, GraphNode, Options, Parse, ProcessFile } from './interface';

async function parseFile<T>(path: string, parse: Parse<T>): Promise<Omit<File<T>, 'path'>> {
  const meta = await parse(path);
  const { contents = null, dependencies } = meta ?? {};

  return { contents, dependencies: Array.isArray(dependencies) ? dependencies : [] };
}

export async function collect<T>(input: string, { resolve, parse }: Options<T>): Promise<GraphNode<T>> {
  // Resolve input file.
  const path = await resolve(input);

  // Initialize graph.
  const graph = new Map<string, Partial<GraphNode<T>>>();

  // Process file.
  const processFile: ProcessFile<T> = async path => {
    let node = graph.get(path);

    // Check if node already exists.
    if (node == null) {
      // Initialize node.
      node = { path };

      // Add node to graph.
      graph.set(path, node);

      // Parse file.
      const { contents, dependencies } = await parseFile(path, parse);

      // Set node properties.
      node.contents = contents;
      node.dependencies = dependencies;

      // Resolve dependencies.
      node.children = await Promise.all(
        dependencies.map(async src => {
          return processFile(await resolve(src, path));
        })
      );
    }

    return node as GraphNode<T>;
  };

  // Process file.
  return processFile(path);
}
