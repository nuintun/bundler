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
 * @function cycle
 * @param {string} path
 * @param {string} referers
 * @param {Map} visited
 * @returns {boolean}
 */
export function cycle(path, referer, visited) {
  if (path === referer) return true;

  const referers = visited.get(referer).referers;

  if (referers.has(path)) return true;

  for (let referer of referers) {
    if (cycle(path, referer, visited)) return true;
  }

  return false;
}
