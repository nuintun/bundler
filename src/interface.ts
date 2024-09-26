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

export interface Parse<T> {
  (path: string): ParsedMeta<T> | void;
  (path: string): Promise<ParsedMeta<T> | void>;
}

export interface OnCycle {
  (path: string, referrer: string): void | never;
}

export interface Resolve {
  (src: string, referrer?: string): string;
  (src: string, referrer?: string): Promise<string>;
}

export type Current<T> = [iterator: IterableIterator<GraphNode<T>>, referrer?: GraphNode<T>];
