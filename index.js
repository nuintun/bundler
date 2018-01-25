/**
 * @module index
 * @license MIT
 * @version 2018/01/25
 */

import Node from './lib/node';
import Visitor from './lib/Visitor';

export default class Bundler {
  constructor(entry, parser, options) {
    return this.bundle(entry, parser, options);
  }

  async bundle(entry, parser, options) {
    return new Promise((resolve, reject)=>{
      resolve(await new Visitor(new Node(await parser(entry))));
    });
  }
}
