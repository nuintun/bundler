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
  return array.reduce((array, value) => array.concat(value), []);
}

/**
 * @function unique
 * @param {Array} array
 * @param {Function} filter
 * @returns {Array}
 */
export function unique(array, filter = value => value) {
  const marks = new Set();

  return array.filter(value => {
    const mark = filter(value);

    if (marks.has(mark)) return false;

    marks.add(mark);

    return true;
  });
}

/**
 * @function visitReferers
 * @param {string} input
 * @param {Set} referers
 * @param {Map} visited
 * @returns {boolean}
 */
function visitReferers(input, referers, visited) {
  for (let referer of referers) {
    if (cycle(input, referer, visited)) return true;
  }

  return false;
}

/**
 * @function cycle
 * @param {string} input
 * @param {string} referer
 * @param {Map} visited
 * @returns {boolean}
 */
export function cycle(input, referer, visited) {
  if (input === referer) return true;

  const referers = visited.get(referer).referers;

  if (referers.has(input)) return true;

  return visitReferers(input, referers, visited);
}
