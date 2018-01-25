/**
 * @module node
 * @license MIT
 * @version 2018/01/25
 */

export default class Node {
  constructor(data) {
    this.data = data;
    this.children = new Set();
  }

  append(node) {
    this.children.add(node);
  }

  remove(node) {
    this.children.delete(node);
  }

  has(node) {
    return this.children.has(node);
  }
}
