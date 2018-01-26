/**
 * @module index
 * @license MIT
 * @version 2018/01/25
 */

import Visitor from './lib/Visitor';

export default class Bundler {
  constructor(options) {
    return this.bundle(options);
  }

  bundle(options) {
    return new Promise(async (resolve, reject) => {
      const visitor = new Visitor(options);

      try {
        resolve(await visitor.traverse());
      } catch (error) {
        reject(error);
      }
    });
  }
}
