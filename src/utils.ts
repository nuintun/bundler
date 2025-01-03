/**
 * @module utils
 */

import { Options } from './interface';

export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

export function assertOptions<T>(options?: Options<T>): never | Options<T> {
  if (!options) {
    throw new Error('options is required');
  }

  const keys = ['resolve', 'parse'] as const;

  for (const key of keys) {
    // Assert resolve and parse.
    if (!isFunction(options[key])) {
      throw new TypeError(`options.${key} must be a function`);
    }
  }

  return options;
}
