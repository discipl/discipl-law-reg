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

    const identifierFields = [['acts', 'act'], ['facts', 'fact'], ['duties', 'duty']]
    for (let identifierField of identifierFields) {
      this.identifierPaths = this.model[identifierField[0]].reduce((acc, _item, index) => {
        const path = [identifierField[0], index, identifierField[1]]
        const node = jsonc.findNodeAtLocation(this.tree, path)
        acc[node.value] = path
        return acc
      }, this.identifierPaths)
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
     * @return {IdentifierInfo|undefined} The identifier and offset if it exists,
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
