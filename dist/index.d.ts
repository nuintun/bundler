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
declare type parse = (path: string) => AnalysisResults;
declare type resolve = (src: string, referer: string) => string;
interface Options {
    parse: parse;
    cycle?: boolean;
    resolve: resolve;
    [key: string]: any;
}
export default class Bundler {
    private input;
    private options;
    private completed;
    private metadata;
    private waiting;
    constructor(input: string, options: Options);
    pack(): Promise<Set<Metadata>>;
}
export {};
