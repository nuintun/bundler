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
   * @param {Array} dependencies
   * @param {any} contents
   */
  constructor(path, dependencies = [], contents = null) {
    this.path = path;
    this.dependencies = dependencies;
    this.contents = contents;
  }
}
