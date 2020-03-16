import * as jsonc from 'jsonc-parser'
import { ValidationError } from './validationError'

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
    this.multiIdentifierPaths = []

    const identifierFields = [['acts', 'act'], ['facts', 'fact'], ['duties', 'duty']]
    for (const identifierField of identifierFields) {
      this.identifierPaths = this.model[identifierField[0]].reduce((acc, _item, index) => {
        const path = [identifierField[0], index, identifierField[1]]
        const node = jsonc.findNodeAtLocation(this.tree, path)
        acc[node.value] = path
        return acc
      }, this.identifierPaths)
    }

    this._populateMultiIdentifierPaths(identifierFields)

    const indexedFields = [['acts', 'act'], ['acts', 'actor'], ['acts', 'object'], ['acts', 'recipient'],
      ['acts', 'preconditions'],
      ['facts', 'fact'], ['facts', 'function'],
      ['duties', 'duty'], ['duties', 'duty-components'], ['duties', 'duty-holder'], ['duties', 'duty-holder'], ['duties', 'claimant'], ['duties', 'create'], ['duties', 'terminate']]
    for (const indexField of indexedFields) {
      if (this.model[indexField[0]]) {
        this.referencePaths = this.model[indexField[0]].reduce((acc, item, index) => {
          // console.log("Reducing");
          const path = [indexField[0], index, indexField[1]]
          this._accumulateIdentifiers(path, acc)

          return acc
        }, this.referencePaths)
      }

      const indexedSubFields = [['acts', 'create'], ['acts', 'terminate']]
      for (const indexField of indexedSubFields) {
        this.referencePaths = this.model[indexField[0]].reduce((acc, item, index) => {
          if (item[indexField[1]]) {
            for (let subIndex = 0; subIndex < item[indexField[1]].length; subIndex++) {
              const path = [indexField[0], index, indexField[1], subIndex]
              this._accumulateIdentifiers(path, acc)
            }
          }
          return acc
        }, this.referencePaths)
      }
    }
  }

  /**
   * This method populates 'multiIdentifierPaths' with multiple positions of a identifier
   * as Key (String): Value (Collection).
   * @param {Array<Array<string>>} identifierFields
   * @private
   */
  _populateMultiIdentifierPaths (identifierFields) {
    for (const identifierField of identifierFields) {
      this.multiIdentifierPaths = this.model[identifierField[0]]
        .reduce((acc, _item, index) => {
          const path = [identifierField[0], index, identifierField[1]]
          const node = jsonc.findNodeAtLocation(this.tree, path)
          acc[node.value] = [...(acc[node.value] || []), path]
          return acc
        }, this.multiIdentifierPaths)
    }
  }

  _accumulateIdentifiers (path, acc) {
    const node = jsonc.findNodeAtLocation(this.tree, path)
    if (node) {
      const identifiers = this._extractIdentifiersFromString(node.value)
      if (identifiers) {
        for (const identifier of identifiers) {
          if (acc[identifier]) {
            acc[identifier].push(path)
          } else {
            acc[identifier] = [path]
          }
        }
      }
    }
  }

  /**
   * Identifier information
   * @typedef  {Object} IdentifierInfo
   *
   * @property {string} identifier - The identifier in question
   * @property {string | number} offset - Start location in raw string
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
      const m = regex.exec(value)
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

  /**
   * Get the validation errors for the model
   * @returns {ValidationError[]} Validation errors
   */
  getDiagnostics () {
    const actNameValidationErrors = this._checkIdentifiers('acts', 'act', /^<<.+>>$/)
    const factNameValidationErrors = this._checkIdentifiers('facts', 'fact', /^\[.+\]$/)
    const dutyNameValidationErrors = this._checkIdentifiers('duties', 'duty', /^<.+>$/)
    const duplicateIdentifiersValidationErrors = this._findOverallDuplicateIdentifiers()

    const referenceErrors = this._checkReferences()

    return actNameValidationErrors.concat(factNameValidationErrors, dutyNameValidationErrors, referenceErrors, duplicateIdentifiersValidationErrors)
  }

  /***
   * Does a overall look at duplicate identifiers,
   * e.g. <<act>> is not only findable on 'ACTS' field but as well
   * on 'FACTS' field and in between.
   *
   * @returns {ValidationError[]} Validation errors
   * @private
   */
  _findOverallDuplicateIdentifiers () {
    const validationError = []
    Object.keys(this.multiIdentifierPaths).filter(value =>
      this.multiIdentifierPaths[value].length > 1)
      .forEach(key => {
        const errors = this.multiIdentifierPaths[key]
          .map(path => {
            const node = jsonc.findNodeAtLocation(this.tree, path)
            const beginPosition = node.offset
            const endPosition = node.offset + node.length
            return new ValidationError(
              'LR0003',
              'Duplicate identifier',
              [beginPosition, endPosition],
              'ERROR',
              key,
              path
            )
          })
        validationError.push(errors)
      })
    return validationError.flatMap(value => value)
  }

  /**
   *
   * @param flintItems - Plural form of flint items to be checked
   * @param flintItem - Signular form of flint items to be checked
   * @param pattern - Regex that should match the identifier
   * @return {ValidationError[]} Validation errors
   * @private
   */
  _checkIdentifiers (flintItems, flintItem, pattern) {
    return this.model[flintItems]
      .filter((item) => typeof item[flintItem] !== 'string' || !item[flintItem].match(pattern))
      .map((item) => {
      // console.log(item[flintItem])
        const node = jsonc.findNodeAtLocation(this.tree, this.identifierPaths[item[flintItem]])
        const beginPosition = node.offset
        const endPosition = node.offset + node.length

        return new ValidationError(
          'LR0001',
          'Invalid name for identifier',
          [beginPosition, endPosition],
          'ERROR',
          item[flintItem].toString(),
          this.identifierPaths[item[flintItem]]
        )
      })
  }

  _checkReferences () {
    const concat = (x, y) => x.concat(y)
    const createTerminateErrors = this.model.acts.map((act) => {
      const basePath = this.identifierPaths[act.act]
      const createNode = jsonc.findNodeAtLocation(this.tree, [basePath[0], basePath[1], 'create'])
      const terminateNode = jsonc.findNodeAtLocation(this.tree, [basePath[0], basePath[1], 'terminate'])

      const createErrors = createNode ? this._checkCreateTerminate(act.create, createNode) : []
      const terminateErrors = terminateNode ? this._checkCreateTerminate(act.terminate, terminateNode) : []
      return createErrors.concat(terminateErrors)
    }).reduce(concat, [])

    const veryStrict = []
    const lessStrict = ['']
    const factStrict = ['<<>>', '[]']
    const expressionCheckInfo = [['acts', 'actor', veryStrict], ['acts', 'object', veryStrict], ['acts', 'recipient', veryStrict],
      ['acts', 'preconditions', lessStrict], ['facts', 'function', factStrict]]

    const expressionErrors = expressionCheckInfo.map((expressionCheckPath) => {
      return this.model[expressionCheckPath[0]].map((item, index) => {
        const node = jsonc.findNodeAtLocation(this.tree, [expressionCheckPath[0], index, expressionCheckPath[1]])
        // console.log("ExpCheck en index", expressionCheckPath, index);
        if (node && typeof node.value === 'string') {
          // console.log("Node", node);
          return this._validateParsedExpression(node.value, node.offset, expressionCheckPath[2])
        } else {
          return this._validateParsedExpressionNode(node)
        }
      }).reduce(concat, [])
    }).reduce(concat, [])

    return createTerminateErrors.concat(expressionErrors)
  }

  _checkCreateTerminate (referenceString, node) {
    const createTerminateErrors = []
    const parsedReferences = typeof referenceString === 'string' ? referenceString.split(';').map(item => item.trim()) : referenceString

    for (let i = 0; i < parsedReferences.length; i++) {
      const reference = parsedReferences[i]
      if (reference.trim() === '') {
        continue
      }
      const offset = jsonc.findNodeAtLocation(node, [i]).offset + 1
      const error = this._validateReference(reference, offset)

      if (error) {
        createTerminateErrors.push(error)
      }
    }
    return createTerminateErrors
  }

  _validateReference (reference, beginOffset) {
    if (!this.identifierPaths[reference]) {
      const path = jsonc.getNodePath(jsonc.findNodeAtOffset(this.tree, beginOffset))
      return {
        code: 'LR0002',
        message: 'Undefined item',
        offset: [beginOffset, beginOffset + reference.length],
        severity: 'WARNING',
        source: reference,
        path: path
      }
    }
  }

  _validateParsedExpressionNode (expression) {
    let errors = []
    const operandsNode = jsonc.findNodeAtLocation(expression, ['operands'])

    if (operandsNode) {
      for (const subNode of operandsNode.children) {
        errors = errors.concat(this._validateParsedExpressionNode(subNode))
      }
    }

    const operandNode = jsonc.findNodeAtLocation(expression, ['operand'])

    if (operandNode) {
      errors = errors.concat(this._validateParsedExpressionNode(operandNode.value))
    }

    const itemsNode = jsonc.findNodeAtLocation(expression, ['items'])

    if (itemsNode) {
      errors = errors.concat(this._validateParsedExpressionNode(itemsNode))
    }

    if (expression && expression.type === 'string') {
      const error = this._validateReference(expression.value, expression.offset + 1)
      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  _validateParsedExpression (expression, beginOffset, exceptions = []) {
    let errors = []
    if (typeof expression === 'string') {
      if (exceptions.includes(expression.trim())) {
        return []
      }

      const error = this._validateReference(expression, beginOffset + 1)
      if (error) {
        errors.push(error)
      }
    }

    if (expression.operands) {
      for (const operand of expression.operands) {
        errors = errors.concat(this._validateParsedExpression(operand, beginOffset, exceptions))
      }
    }

    if (expression.operand) {
      errors = errors.concat(this._validateParsedExpression(expression.operand, beginOffset, exceptions))
    }

    return errors
  }
}

export { ModelValidator }
