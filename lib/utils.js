/**
 * @module utils
 * @license MIT
 * @version 2018/01/25
 */

/**
 * @function flatten
 * @param {Array} array
 * @returns {Array}
 */
export function flatten(array) {
  return array.reduce(function(array, value) {
    if (!value) return array;

    return array.concat(Array.isArray(value) ? flatten(value) : value);
  }, []);
}
