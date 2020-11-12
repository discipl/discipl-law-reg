/**
 * Converts an array into an object
 *
 * @param {array} arr - array with objects in it
 * @returns {object} object instead of the given array
 */
export function arrayToObject (arr) {
  const obj = {}
  Object.keys(arr).forEach(element => {
    Object.assign(obj, arr[element])
  })
  return obj
}
