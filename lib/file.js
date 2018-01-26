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
   * @param {any} data
   */
  constructor(path, data = null) {
    this.path = path;
    this.data = data;
  }
}
