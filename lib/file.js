/**
 * @module file
 * @license MIT
 * @version 2018/01/25
 */

export default class File {
  constructor(path, data = null) {
    this.path = path;
    this.data = data;
  }
}
