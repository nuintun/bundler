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

export interface GraphNode<T> {
  value: File<T>;
  children: string[];
}

export interface ParseOutput<T> {
  contents?: T;
  dependencies?: string[];
}

export interface VisitedNode<T> {
  value: File<T>;
  referrer?: VisitedNode<T>;
  children: IterableIterator<string>;
}

export interface OnCycle {
  (path: string, referrer: string): void | never;
}

export interface Parse<T> {
  (path: string): ParseOutput<T> | void;
  (path: string): Promise<ParseOutput<T> | void>;
}

export interface Resolve {
  (src: string, referrer?: string): string;
  (src: string, referrer?: string): Promise<string>;
}

export interface ProcessFile<T> {
  (path: string): Promise<Map<string, GraphNode<T>>>;
}

export interface VisitNode<T> {
  (path: string, referrer?: VisitedNode<T>): VisitedNode<T> | void;
}
