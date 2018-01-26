/**
 * @module visitor
 * @license MIT
 * @version 2018/01/25
 */

import Node from './lib/node';

export default class Visitor {
  constructor(options) {
    this.visited = new Set();
  }

  traverse() {
    return new Promise(async (resolve, reject) => {
      resolve(await Promise.all());
    });
  }
}
