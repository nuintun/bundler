/**
 * @module index
 * @license MIT
 * @version 2018/01/25
 */

import Visitor from './lib/visitor';

export default class Bundler {
  constructor(options = {}) {
    return this.bundle(options);
  }

  bundle(options) {
    return new Promise(async resolve => {
      resolve(await new Visitor(options));
    });
  }
}
