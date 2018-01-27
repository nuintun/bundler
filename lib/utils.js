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
 * @function function
 * @param {Array} array
 * @returns {Array}
 */
export function unique(array) {
  const cached = new Set();

  return array.filter(file => {
    const path = file.path;

    if (cached.has(path)) return false;

    cached.add(path);

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
