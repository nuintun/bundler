/**
 * @module file
 * @license MIT
 * @version 2018/01/25
 */

/**
 * @class File
 */
export default class File {
  /**
   * @constructor
   * @param {string} path
   * @param {Array|Set} dependencies
   * @param {any} contents
   * @returns File
   */
  constructor(path, dependencies = new Set(), contents = null) {
    this.path = path;

    // Normalize dependencies
    if (!(dependencies instanceof Set)) {
      if (Array.isArray(dependencies)) {
        dependencies = new Set(dependencies);
      } else {
        dependencies = new Set();
      }
    }

    this.dependencies = dependencies;
    this.contents = contents;
  }
}
