/**
 * @module file
 * @license MIT
 * @author nuintun
 */

/**
 * @class File
 */
export default class File {
  /**
   * @constructor
   * @param {string} path
   * @param {Array|Set} [dependencies]
   * @param {any} [contents]
   * @returns {File}
   */
  constructor(path, dependencies = new Set(), contents = null) {
    this.path = path;

    // Normalize dependencies
    if (Array.isArray(dependencies)) {
      dependencies = new Set(dependencies);
    } else if (!(dependencies instanceof Set)) {
      dependencies = new Set();
    }

    this.dependencies = dependencies;
    this.contents = contents;
  }
}
