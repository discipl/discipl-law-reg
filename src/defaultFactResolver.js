/**
 * Create a default resolver and extend it's logic with additional facts and a fallback resolver. The fallback is used
 * when no other methods are available to resolve the supplied facts.
 *
 * @param {function} factResolver - Function used to resolve facts to fall back on if no other method is available
 * @param {Object} factsSupplied - Facts object
 * @return {function} Function used to resolve facts to fall back on if no other method is available
 */
export function wrapWithDefault (factResolver, factsSupplied) {
  return async (fact, listNames, listIndices, possibleCreatingActions) => {
    let factsObject = factsSupplied
    for (let i = 0; i < listNames.length; i++) {
      const listName = listNames[i]
      factsObject[listName] = factsObject[listName] ? factsObject[listName] : []
      const listIndex = listIndices[i]

      factsObject[listName][listIndex] = factsObject[listName][listIndex] ? factsObject[listName][listIndex] : {}

      factsObject = factsObject[listName][listIndex]
    }
    let maybeCreatingAction = null
    if (possibleCreatingActions && possibleCreatingActions.length === 1) {
      maybeCreatingAction = possibleCreatingActions[0]
    }
    const result = factsObject[fact] || maybeCreatingAction || factResolver(fact, listNames, listIndices, possibleCreatingActions)
    factsObject[fact] = await result
    return result
  }
}
