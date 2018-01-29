/**
 * @module index
 * @license MIT
 * @version 2018/01/25
 */

import Visitor from './lib/visitor';

/**
 * @class Bundler
 */
export default class Bundler extends Visitor {
  /**
   * @constructor
   * @param {Object} options
   */
  constructor(options = {}) {
    super(options);

    return this.traverse(options.input, options);
  }
}
