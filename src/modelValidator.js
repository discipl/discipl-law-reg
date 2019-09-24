import * as jsonc from 'jsonc-parser'

class ModelValidator {
  /**
     * Construct a new model validator from raw string data
     *
     * @param {string} rawData
     */
  constructor (rawData) {
    const errors = []
    this.tree = jsonc.parseTree(rawData)
    this.model = jsonc.parse(rawData, errors)
    this.rawData = rawData

    // TODO check errors

    this.identifierPaths = {}
    this.referencePaths = {}

    const identifierFields = [['acts', 'act'], ['facts', 'fact'], ['duties', 'duty']]
    for (let identifierField of identifierFields) {
      this.identifierPaths = this.model[identifierField[0]].reduce((acc, _item, index) => {
        const path = [identifierField[0], index, identifierField[1]]
        const node = jsonc.findNodeAtLocation(this.tree, path)
        acc[node.value] = path
        return acc
      }, this.identifierPaths)
    }

    const indexedFields = [['acts', 'act'], ['acts', 'actor'], ['acts', 'object'], ['acts', 'interested-party'],
      ['acts', 'preconditions'], ['acts', 'create'], ['acts', 'terminate'],
      ['facts', 'fact'], ['facts', 'function'],
      ['duties', 'duty'], ['duties', 'duty-components'], ['duties', 'duty-holder'], ['duties', 'duty-holder'], ['duties', 'claimant'], ['duties', 'create'], ['duties', 'terminate']]
    for (let indexField of indexedFields) {
      this.referencePaths = this.model[indexField[0]].reduce((acc, item, index) => {
        // console.log("Reducing");
        const path = [indexField[0], index, indexField[1]]
        const node = jsonc.findNodeAtLocation(this.tree, path)
        if (node) {
          const identifiers = this._extractIdentifiersFromString(node.value)
          if (identifiers) {
            for (let identifer of identifiers) {
              if (acc[identifer]) {
                acc[identifer].push(path)
              } else {
                acc[identifer] = [path]
              }
            }
          }
        }

        return acc
      }, this.referencePaths)
    }
  }

  /**
     * Identifier information
     * @typedef  {Object} IdentifierInfo
     *
     * @property {string} identifier - The identifier in question
     * @property {string} offset - Start location in raw string
     */

  /**
     * Finds definition for identifier located at a particular offset
     *
     * @param {number} offset - Offset that is located in the identifier
     * @return {IdentifierInfo|undefined} The identifier and offset of the definition if it exists,
     */
  getDefinitionForOffset (offset) {
    const identifier = this._extractIdentifier(offset)
    if (this.identifierPaths[identifier]) {
      const node = jsonc.findNodeAtLocation(this.tree, this.identifierPaths[identifier])

      return {
        identifier,
        offset: node.offset
      }
    }
  }

  _extractIdentifiersFromString (str) {
    const regex = /(\[.*\])|(<<.*>>)|(<.*>)/g

    const result = []
    let match = regex.exec(str)
    while (match) {
      if (!result.includes(match[0])) {
        result.push(match[0])
      }

      match = regex.exec(str)
    }

    return result
  }

  /**
   * Returns all definitions for a given type
   *
   * @param {('acts'|'facts'|'duties')} type
   * @return {IdentifierInfo[]} The identifier information for all defitions of the chosen type
   */
  getDefinitionsForType (type) {
    return Object.entries(this.identifierPaths).filter((identifierPath) => {
      return identifierPath[1][0] === type
    }).map((identifierPath) => {
      const node = jsonc.findNodeAtLocation(this.tree, identifierPath[1])
      return {
        identifier: identifierPath[0],
        offset: node.offset
      }
    })
  }

  /**
   * Get all the references to an identifier located at the given offset
   *
   * @param {number} offset - offset located inside the identifier
   * @return {IdentifierInfo[]} The identifier information for all references to the identifier
   */
  getReferencesForOffset (offset) {
    const identifier = this._extractIdentifier(offset)
    if (this.referencePaths[identifier]) {
      return this.referencePaths[identifier].map((referencePath) => {
        const node = jsonc.findNodeAtLocation(this.tree, referencePath)

        return {
          identifier,
          offset: node.offset
        }
      })
    }

    return []
  }

  _extractIdentifier (offset) {
    const location = jsonc.getLocation(this.rawData, offset)
    const value = location.previousNode.value
    const offsetInValue = offset - location.previousNode.offset

    // Matches [facts], <<acts>> and <duties>
    const regex = /(\[.*\])|(<<.*>>)|(<.*>)/g

    let identifier
    while (true) {
      let m = regex.exec(value)
      if (!m) {
        break
      }
      if (m.index <= offsetInValue && m.index + m[0].length >= offsetInValue) {
        identifier = m[0]
        break
      }
    }

    return identifier
  }
}

export { ModelValidator }
