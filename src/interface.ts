/**
 * @module interface
 */

export interface File<T> {
  path: string;
  contents: T | null;
  dependencies: string[];
}

export interface Options<T> {
  parse: Parse<T>;
  resolve: Resolve;
  oncycle?: OnCycle;
}

export interface ParsedMeta<T> {
  contents?: T;
  dependencies?: string[];
}

export interface ProcessFile<T> {
  (path: string): Promise<GraphNode<T>>;
}

export interface GraphNode<T> extends File<T> {
  children: GraphNode<T>[];
}

export interface OnCycle {
  (path: string, referrer: string): void | never;
}

export interface Resolve {
  (src: string, referrer?: string): string | Promise<string>;
}

export interface Parse<T> {
  (path: string): ParsedMeta<T> | Promise<ParsedMeta<T> | void> | void;
}

export type Current<T> = [iterator: IterableIterator<GraphNode<T>>, referrer?: GraphNode<T>];
