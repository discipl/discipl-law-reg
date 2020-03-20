import { AbundanceService } from '@discipl/abundance-service'
import { ModelValidator } from './modelValidator'
import { BigUtil } from './big_util'

import * as log from 'loglevel'
import { BaseConnector } from '@discipl/core-baseconnector'
import Big from 'big.js'

const DISCIPL_FLINT_MODEL = 'DISCIPL_FLINT_MODEL'
const DISCIPL_FLINT_FACT = 'DISCIPL_FLINT_FACT'
const DISCIPL_FLINT_ACT = 'DISCIPL_FLINT_ACT'
const DISCIPL_FLINT_DUTY = 'DISCIPL_FLINT_DUTY'
const DISCIPL_FLINT_ACT_TAKEN = 'DISCIPL_FLINT_ACT_TAKEN'
const DISCIPL_FLINT_FACTS_SUPPLIED = 'DISCIPL_FLINT_FACTS_SUPPLIED'
const DISCIPL_FLINT_GLOBAL_CASE = 'DISCIPL_FLINT_GLOBAL_CASE'
const DISCIPL_FLINT_PREVIOUS_CASE = 'DISCIPL_FLINT_PREVIOUS_CASE'
const DISCIPL_FLINT_MODEL_LINK = 'DISCIPL_FLINT_MODEL_LINK'

const DISCIPL_IS_MARKER = 'IS:'
const DISCIPL_ANYONE_MARKER = 'ANYONE'

const logger = log.getLogger('disciplLawReg')

class LawReg {
  constructor (abundanceService = new AbundanceService()) {
    this.abundance = abundanceService
  }

  getAbundanceService () {
    return this.abundance
  }

  /**
   * @typedef {Object} ParsedExpression
   * @property {string} expression - The type of expression (AND/OR/NOT)
   * @property {Array.<ParsedExpression|string>} [operands] - Operands of an AND/OR
   * @property {ParsedExpression|string} [operand] - Operand of a NOT
   */

  /**
   * Checks a parsed expression by considering the atomic parts and evaluating them
   *
   * @param {ParsedExpression|string} fact - Parsed fact object (might be string if the object is an atomic fact
   * @param {object} ssid - Identity doing the checking
   * @param {Context} context - Context of the check
   * @returns {Promise<boolean>}
   */
  async checkExpression (fact, ssid, context) {
    let hasUndefined = false
    const expr = fact.expression
    switch (expr) {
      case 'OR':
        logger.debug('Switch case: OR')
        for (const op of fact.operands) {
          const operandResult = await this.checkExpression(op, ssid, context)
          if (operandResult === true) {
            logger.debug('Resolved OR as true, because', op, 'is true')
            return true
          }

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
          }
        }

        const result = hasUndefined ? undefined : false
        logger.debug('Resolved OR as', result)
        return result
      case 'AND':
        logger.debug('Switch case: AND')
        for (const op of fact.operands) {
          const operandResult = await this.checkExpression(op, ssid, context)
          logger.debug('OperandResult in AND', operandResult, 'for operand', op)
          if (operandResult === false) {
            logger.debug('Resolved AND as false, because', op, 'is false')
            return false
          }

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
          }
        }
        const andResult = hasUndefined ? undefined : true
        logger.debug('Resolved AND as', andResult)
        return andResult
      case 'NOT':
        logger.debug('Switch case: NOT')
        const value = await this.checkExpression(fact.operand, ssid, context)
        return typeof value === 'boolean' ? !value : undefined
      case 'LIST':
        logger.debug('Switch case: LIST')
        if (!context.listNames) {
          context.listNames = []
          context.listIndices = []
        }
        context.listNames.push(fact.name)

        const listIndex = context.listIndices.push(0) - 1
        const listContentResult = []
        while (true) {
          const op = fact.items
          const operandResult = await this.checkExpression(op, ssid, context)
          logger.debug('OperandResult in LIST', operandResult, 'for operand', op, 'and index', context.listIndices[listIndex])

          listContentResult.push(operandResult)

          if (operandResult === false) {
            logger.debug('Stopping LIST concatenation, because', op, 'is false')
            break
          }

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
            break
          }

          context.listIndices[listIndex] += 1
        }

        context.listNames.pop()
        const resultIndex = context.listIndices.pop()

        const listResult = hasUndefined ? undefined : (resultIndex !== 0 ? listContentResult : false)
        logger.debug('Resolved LIST as', listResult)
        return listResult
      case 'LESS_THAN':
        logger.debug('Switch case: LESS_THAN')
        let lastOperandResult
        for (const op of fact.operands) {
          const operandResult = await this.checkExpression(op, ssid, context)
          logger.debug('OperandResult in LESS_THAN', operandResult, 'for operand', op)
          if (typeof lastOperandResult !== 'undefined') {
            if (BigUtil.lessThan(operandResult, lastOperandResult)) {
              logger.debug('Resolved LESS_THAN as false, because', String(lastOperandResult), 'is not less than', String(operandResult))
              return false
            }
          }

          lastOperandResult = operandResult

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
          }
        }
        const lessThanResult = hasUndefined ? undefined : true
        logger.debug('Resolved LESS_THAN as', String(lessThanResult))
        return lessThanResult
      case 'EQUAL':
        logger.debug('Switch case: EQUAL')
        let lastEqualOperandResult
        for (const op of fact.operands) {
          const operandResult = await this.checkExpression(op, ssid, context)
          logger.debug('OperandResult in EQUAL', String(operandResult), 'for operand', op)
          if (typeof lastEqualOperandResult !== 'undefined') {
            if (!BigUtil.equal(operandResult, lastEqualOperandResult)) {
              logger.debug('Resolved EQUAL as false, because', String(lastEqualOperandResult), 'does not equal', String(operandResult))
              return false
            }
          }

          lastEqualOperandResult = operandResult

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
          }
        }
        const equalResult = hasUndefined ? undefined : true
        logger.debug('Resolved EQUAL as', String(equalResult))
        return equalResult
      case 'SUM':
        logger.debug('Switch case: SUM')
        let sumResult = 0
        for (const op of fact.operands) {
          const operandResult = await this.checkExpression(op, ssid, context)
          logger.debug('OperandResult in SUM', String(operandResult), 'for operand', op)
          if (Array.isArray(operandResult)) {
            for (const arrayOp of operandResult) {
              if (arrayOp) {
                sumResult = BigUtil.add(sumResult, arrayOp)
              }
            }
          } else {
            sumResult = BigUtil.add(sumResult, operandResult)
          }

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
          }
        }
        const finalSumResult = hasUndefined ? undefined : sumResult
        logger.debug('Resolved SUM as', String(finalSumResult))
        return finalSumResult
      case 'PRODUCT':
        logger.debug('Switch case: PRODUCT')
        let productResult = 1
        for (const op of fact.operands) {
          const operandResult = await this.checkExpression(op, ssid, context)
          logger.debug('OperandResult in PRODUCT', String(operandResult), 'for operand', op)
          if (Array.isArray(operandResult)) {
            for (const arrayOp of operandResult) {
              if (arrayOp) {
                productResult = BigUtil.multiply(arrayOp, productResult)
              }
            }
          } else {
            productResult = BigUtil.multiply(operandResult, productResult)
          }

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
          }
        }
        const finalProductResult = hasUndefined ? undefined : productResult
        logger.debug('Resolved PRODUCT as', String(finalProductResult))
        return finalProductResult
      case 'MIN':
        logger.debug('Switch case: MIN')
        let minResult
        for (const op of fact.operands) {
          const operandResult = await this.checkExpression(op, ssid, context)
          logger.debug('OperandResult in MIN', operandResult, 'for operand', op)
          if (typeof minResult === 'undefined' || operandResult < minResult) {
            minResult = operandResult
          }

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
          }
        }
        const finalMinResult = hasUndefined ? undefined : minResult
        logger.debug('Resolved MIN as', finalMinResult)
        return finalMinResult
      case 'MAX':
        logger.debug('Switch case: MAX')
        let maxResult
        for (const op of fact.operands) {
          const operandResult = await this.checkExpression(op, ssid, context)
          logger.debug('OperandResult in MAX', operandResult, 'for operand', op)
          if (typeof maxResult === 'undefined' || operandResult > maxResult) {
            maxResult = operandResult
          }

          if (typeof operandResult === 'undefined') {
            hasUndefined = true
          }
        }
        const finalMaxResult = hasUndefined ? undefined : maxResult
        logger.debug('Resolved MAX as', finalMaxResult)
        return finalMaxResult
      case 'LITERAL':
        let literalValue = fact.operand
        if (typeof literalValue === 'number') {
          literalValue = Big(literalValue)
        }
        return literalValue
      default:
        logger.debug('Switch case: default')
        if (typeof fact === 'string') {
          return this.checkFact(fact, ssid, context)
        }

        throw new Error('Unknown expression type')
    }
  }

  /**
   * Extract the DID being referred, if the input is an IS-construction
   *
   * @param {string} functionRef - String with a possible IS-construction
   * @returns {string|undefined} - The DID being referred if it is an IS-construction, undefined otherwise
   */
  static extractDidFromIsConstruction (functionRef) {
    if (typeof functionRef === 'string' && functionRef.startsWith(DISCIPL_IS_MARKER)) {
      const possibleDid = functionRef.replace('IS:', '')
      if (BaseConnector.isDid(possibleDid)) {
        return possibleDid
      }
    }
  }

  /**
   * Checks a fact link by checking created objects, `IS`-constructions and else passing the function to {@link checkFact}
   *
   * @param {string} factLink - Link to the fact
   * @param {string} fact - Name of the fact
   * @param {object} ssid - Identity of the entity performing the check
   * @param {Context} context - Represents the context of the check
   * @returns {Promise<boolean>}
   */
  async checkFactLink (factLink, fact, ssid, context) {
    const core = this.abundance.getCoreAPI()
    const factReference = await core.get(factLink, ssid)
    const functionRef = factReference.data[DISCIPL_FLINT_FACT].function

    if (functionRef === '<<>>') {
      const result = await this.checkCreatedFact(fact, ssid, context)
      logger.debug('Resolving fact', fact, 'as', result, 'by determining earlier creation')
      return result
    }

    if (functionRef === DISCIPL_ANYONE_MARKER) {
      logger.debug('Resolving fact', fact, 'as true, because anyone can be this')
      return true
    }

    const did = LawReg.extractDidFromIsConstruction(functionRef)
    if (did != null) {
      const result = ssid.did === did || !context.myself
      logger.debug('Resolving fact', fact, 'as', result, 'by', context.myself ? 'did-identification' : 'the concerned being someone else')
      return result
    }

    return this.checkFact(functionRef, ssid, { ...context, previousFact: fact })
  }

  /**
   * @typedef {Object} Context
   * @property {function} factResolver - Function to resolve facts if it cannot be done another way
   * @property {string} caseLink - Link to the current case
   * @property {object} [facts] - Parsed facts from flint model
   * @property {string} [previousFact] - last fact that was considered in the context
   * @property {boolean} [myself] - `IS:` constructions will be resolved iff it concerns the person themselves
   * @property {object} [factReference] - Map from fact names to fact links in a published FLINT model
   * @property {string} [flintItem] - The FLINT item (actor, object, etc) that is currently under consideration
   * @property {array} [listNames] - Names of (subsequent) lists that belong to the current context
   * @property {array} [listIndices] - Index of current location in the list
   */
  /**
   * Checks a fact by doing
   * 1. A lookup in the fact reference
   * 2. Checking if it is an expression, and parsing it
   *   a. If it is a simple expression, pass to the factResolver
   *   b. If it is a complex expression, parse it and evaluate it by parts
   *
   * @param {string|object} fact - fact or expression
   * @param {object} ssid - ssid representing the actor
   * @param {Context} context -
   * @returns {Promise<boolean>} - result of the fact
   */
  async checkFact (fact, ssid, context) {
    logger.debug('Checking fact', fact)
    const factLink = context.facts ? context.facts[fact] : null
    if (factLink) {
      return this.checkFactLink(factLink, fact, ssid, context)
    }

    if (typeof fact === 'string') {
      return LawReg.checkFactWithResolver(fact, ssid, context)
    } else {
      return this.checkExpression(fact, ssid, context)
    }
  }

  /**
   * Checks a fact by using the callback provided as factResolver
   * If an empty fact is to be checked, this is because a reference was followed. in this case we fall back
   * to the previousFact, which likely contains information that can be used to resolve this.
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {object} ssid - Identity of entity doing the checking
   * @param {Context} context - context of the checking
   * @returns {boolean}
   */
  static async checkFactWithResolver (fact, ssid, context) {
    const factToCheck = fact === '[]' || fact === '' ? context.previousFact : fact
    const listNames = context.listNames || []
    const listIndices = context.listIndices || []
    const result = context.factResolver(factToCheck, context.flintItem, listNames, listIndices)
    let resolvedResult = await Promise.resolve(result)
    if (typeof resolvedResult === 'number') {
      resolvedResult = Big(resolvedResult)
    }

    logger.debug('Resolving fact', fact, 'as', String(resolvedResult), 'via', factToCheck, 'by factresolver')
    return resolvedResult
  }

  /**
   * Checks a fact by checking if it has been created in a prior act, and has not been terminated since
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {object} ssid - Identity of entity doing the checking
   * @param {Context} context - context of the checking
   * @returns {boolean}
   */
  async checkCreatedFact (fact, ssid, context) {
    logger.debug('Checking if', fact, 'was created')
    const core = this.abundance.getCoreAPI()
    let actionLink = context.caseLink

    const possibleCreatingActions = []
    const terminatedCreatingActions = []

    while (actionLink != null) {
      const lastAction = await core.get(actionLink, ssid)

      const actLink = lastAction.data[DISCIPL_FLINT_ACT_TAKEN]

      if (actLink != null) {
        const act = await core.get(actLink, ssid)
        logger.debug('Found earlier act', act)

        if (act.data[DISCIPL_FLINT_ACT].create != null && act.data[DISCIPL_FLINT_ACT].create.includes(fact)) {
          possibleCreatingActions.push(actionLink)
        }

        if (act.data[DISCIPL_FLINT_ACT].terminate != null && act.data[DISCIPL_FLINT_ACT].terminate.includes(fact)) {
          const terminatedLink = lastAction.data[DISCIPL_FLINT_FACTS_SUPPLIED][fact]
          terminatedCreatingActions.push(terminatedLink)
        }
      }
      actionLink = lastAction.data[DISCIPL_FLINT_PREVIOUS_CASE]
    }

    const creatingActions = possibleCreatingActions.filter((maybeTerminatedLink) => !terminatedCreatingActions.includes(maybeTerminatedLink))

    if (creatingActions.length === 0) {
      return false
    }

    const result = context.factResolver(fact, context.flintItem, context.listNames || [], context.listIndices || [], creatingActions)
    const resolvedResult = await Promise.resolve(result)

    if (!creatingActions.includes(resolvedResult)) {
      throw new Error('Invalid choice for creating action: ' + resolvedResult)
    }

    return resolvedResult
  }

  /**
   * Converts an array into an object
   *
   * @param {array} arr - array with objects in it
   * @returns {object} object instead of the given array
   */
  arrayToObject (arr) {
    const obj = {}
    Object.keys(arr).forEach(element => {
      Object.assign(obj, arr[element])
    })
    return obj
  }

  /**
   * Returns details of an act, as registered in the model
   *
   * @param {string} actLink - Link to the particular act
   * @param {object} ssid - Identity requesting the information
   * @returns {object}
   */
  async getActDetails (actLink, ssid) {
    const core = this.abundance.getCoreAPI()
    const claimData = await core.get(actLink, ssid)
    return claimData.data[DISCIPL_FLINT_ACT]
  }

  /**
   * @typedef {object} CheckActionResult
   * @property {boolean|*} valid - True iff the action can be taken, undefined if undefined facts would need to be provided to be sure
   * @property {string[]} invalidReasons - Flint items that were resolved as false
   */
  /**
   * Checks if an action is allowed by checking if:
   * 1. The ssid can be the relevant actor
   * 2. The object exists
   * 3. The interested party exists
   * 4. The pre-conditions are fulfilled
   *
   * @param {string} modelLink - Link to a published FLINT model
   * @param {string} actLink - Link to the respective act
   * @param {object} ssid - Identity of intended actor
   * @param {Context} context - Context of the action
   * @param {boolean} earlyEscape - If true, will return a result as ssoon as one of the flint items is detrmined to be false
   * @returns {Promise<CheckActionResult>}
   */
  async checkAction (modelLink, actLink, ssid, context, earlyEscape = false) {
    logger.debug('Checking action', actLink)
    const core = this.abundance.getCoreAPI()
    const modelReference = await core.get(modelLink, ssid)
    logger.debug('Obtained modelReference', modelReference)
    const actReference = await core.get(actLink, ssid)
    const factReference = this.arrayToObject(modelReference.data[DISCIPL_FLINT_MODEL].facts)
    logger.debug('Fact reference obtained from model', factReference)

    const actor = actReference.data[DISCIPL_FLINT_ACT].actor

    const invalidReasons = []

    const checkedActor = await this.checkFact(actor, ssid, { ...context, 'facts': factReference, 'myself': true, 'flintItem': 'actor' })

    if (!checkedActor) {
      invalidReasons.push('actor')
      if (earlyEscape) {
        return {
          'valid': false,
          'invalidReasons': invalidReasons
        }
      }
    }

    const object = actReference.data[DISCIPL_FLINT_ACT].object

    logger.debug('Original object', object)

    const checkedObject = await this.checkFact(object, ssid, { ...context, 'facts': factReference, 'flintItem': 'object' })

    if (!checkedObject) {
      invalidReasons.push('object')
      if (earlyEscape) {
        return {
          'valid': false,
          'invalidReasons': invalidReasons
        }
      }
    }

    const recipient = actReference.data[DISCIPL_FLINT_ACT]['recipient']
    logger.debug('Original recipient', recipient)
    const checkedInterestedParty = await this.checkFact(recipient, ssid, { ...context, 'facts': factReference, 'flintItem': 'recipient' })

    if (!checkedInterestedParty) {
      invalidReasons.push('recipient')
      if (earlyEscape) {
        return {
          'valid': false,
          'invalidReasons': invalidReasons
        }
      }
    }

    const preconditions = actReference.data['DISCIPL_FLINT_ACT'].preconditions

    logger.debug('Original preconditions', preconditions)
    // Empty string, null, undefined are all explictly interpreted as no preconditions, hence the action can proceed
    const checkedPreConditions = preconditions !== '[]' && preconditions != null && preconditions !== '' ? await this.checkFact(preconditions, ssid, { ...context, 'facts': factReference, 'flintItem': 'preconditions' }) : true

    if (!checkedPreConditions) {
      invalidReasons.push('preconditions')
      if (earlyEscape) {
        return {
          'valid': false,
          'invalidReasons': invalidReasons
        }
      }
    }

    if (checkedActor && checkedPreConditions && checkedObject && checkedInterestedParty) {
      logger.info('Prerequisites for act', actLink, 'have been verified')
      return {
        'valid': true,
        'invalidReasons': []
      }
    }

    const definitivelyNotPossible = checkedActor === false || checkedObject === false || checkedInterestedParty === false || checkedPreConditions === false

    const validity = definitivelyNotPossible ? false : undefined

    logger.info('Pre-act check failed due to', invalidReasons, definitivelyNotPossible ? 'It is impossible.' : 'It might work with more information')
    return {
      'valid': validity,
      'invalidReasons': invalidReasons
    }
  }

  /**
   * Returns the names of all acts that can be taken, given the current caseLink, ssid of the actor and a list of facts
   *
   * @param {string} caseLink - Link to the case, last action that was taken
   * @param {object} ssid - Identifies the actor
   * @param {string[]} facts - Array of true facts
   * @param {string[]} nonFacts - Array of false facts
   * @returns {Promise<Array>}
   */
  async getAvailableActs (caseLink, ssid, facts = [], nonFacts = []) {
    const core = this.abundance.getCoreAPI()

    const firstCaseLink = await this._getFirstCaseLink(caseLink, ssid)
    const modelLink = await this._getModelLink(firstCaseLink, ssid)

    const model = await core.get(modelLink, ssid)

    const acts = await model.data[DISCIPL_FLINT_MODEL].acts

    const factResolver = (fact) => {
      if (facts.includes(fact)) {
        return true
      }

      if (nonFacts.includes(fact)) {
        return false
      }
    }

    const defaultFactResolver = this._wrapWithDefault(factResolver, {})

    const allowedActs = []
    logger.debug('Checking', acts, 'for available acts')
    for (const actWithLink of acts) {
      logger.debug('Checking whether', actWithLink, 'is an available option')

      const link = Object.values(actWithLink)[0]

      const checkActionInfo = await this.checkAction(modelLink, link, ssid, { 'factResolver': defaultFactResolver, 'caseLink': caseLink })

      if (checkActionInfo.valid) {
        const actionInformation = {
          'act': Object.keys(actWithLink)[0],
          'link': Object.values(actWithLink)[0]
        }
        allowedActs.push(actionInformation)
      }
    }

    return allowedActs
  }

  /**
   * Returns the names of all acts that could be taken, given the current caseLink, ssid of the actor and a list of facts,
   * if possibly more facts are supplied
   *
   * @param {string} caseLink - Link to the case, last action that was taken
   * @param {object} ssid - Identifies the actor
   * @param {string[]} facts - Array of true facts
   * @param {string[]} nonFacts - Array of false facts
   * @returns {Promise<Array>}
   */
  async getPotentialActs (caseLink, ssid, facts = [], nonFacts = []) {
    const core = this.abundance.getCoreAPI()

    const firstCaseLink = await this._getFirstCaseLink(caseLink, ssid)
    const modelLink = await this._getModelLink(firstCaseLink, ssid)

    const model = await core.get(modelLink, ssid)

    const acts = await model.data[DISCIPL_FLINT_MODEL].acts

    const allowedActs = []
    logger.debug('Checking', acts, 'for available acts')
    for (const actWithLink of acts) {
      const unknownItems = []
      const factResolver = (fact, flintItem) => {
        if (facts.includes(fact)) {
          return true
        }

        if (nonFacts.includes(fact)) {
          return false
        }
      }

      const defaultFactResolver = this._wrapWithDefault(factResolver, {})
      logger.debug('Checking whether', actWithLink, 'is an available option')

      const link = Object.values(actWithLink)[0]
      const checkActionInfo = await this.checkAction(modelLink, link, ssid, { 'factResolver': defaultFactResolver, 'caseLink': caseLink })
      logger.debug('Unknown items', unknownItems)
      if (typeof checkActionInfo.valid === 'undefined') {
        const actionInformation = {
          'act': Object.keys(actWithLink)[0],
          'link': Object.values(actWithLink)[0]
        }
        allowedActs.push(actionInformation)
      }
    }

    return allowedActs
  }

  /**
   * @typedef DutyInformation
   * @property {string} duty - name of the duty
   * @property {string} link - link to the duty in the model
   */

  /**
   * Returns the active duties that apply in the given case for the given ssid
   *
   * @param {string} caseLink - link to the current state of the case
   * @param {object} ssid - identity to find duties for
   * @returns {Promise<DutyInformation[]>}
   */
  async getActiveDuties (caseLink, ssid) {
    const core = this.abundance.getCoreAPI()
    const firstCaseLink = await this._getFirstCaseLink(caseLink, ssid)
    const modelLink = await this._getModelLink(firstCaseLink, ssid)

    const model = await core.get(modelLink, ssid)

    const duties = this.arrayToObject(model.data[DISCIPL_FLINT_MODEL].duties)

    const factReference = this.arrayToObject(model.data[DISCIPL_FLINT_MODEL].facts)

    let actionLink = caseLink

    const terminatedDuties = []
    const activeDuties = []

    while (actionLink != null) {
      const lastAction = await core.get(actionLink, ssid)

      const actLink = lastAction.data[DISCIPL_FLINT_ACT_TAKEN]

      if (actLink != null) {
        const act = await core.get(actLink, ssid)
        logger.debug('Found earlier act', act)

        if (typeof act.data[DISCIPL_FLINT_ACT].create === 'string') {
          const matches = act.data[DISCIPL_FLINT_ACT].create.match(/<[^>]+>/g) || []
          // If the duty is terminated, we should not include it as active
          activeDuties.push(...matches.filter(duty => !terminatedDuties.includes(duty)))
        }

        if (typeof act.data[DISCIPL_FLINT_ACT].terminate === 'string') {
          const matches = act.data[DISCIPL_FLINT_ACT].terminate.match(/<[^>]+>/g) || []
          terminatedDuties.push(...matches)
        }
      }
      actionLink = lastAction.data[DISCIPL_FLINT_PREVIOUS_CASE]
    }

    logger.debug('Active duties', activeDuties, '. Checking ownership now.')
    const ownedDuties = []

    for (const duty of activeDuties) {
      const dutyLink = duties[duty]

      if (dutyLink != null) {
        const dutyInformation = (await core.get(dutyLink, ssid))['data'][DISCIPL_FLINT_DUTY]

        const dutyHolder = dutyInformation['duty-holder']

        if (dutyHolder != null) {
          logger.debug('Checking duty-holder')
          const checkActor = await this.checkFact(dutyHolder, ssid, { 'facts': factReference, 'myself': true, 'flintItem': 'actor', 'caseLink': caseLink })
          if (checkActor) {
            logger.info('Duty', duty, 'is held by', dutyHolder)
            ownedDuties.push({
              'duty': duty,
              'link': dutyLink
            })
          }
        }
      }
    }

    return ownedDuties
  }

  /**
   * Publishes the FLINT model (as JSON) in linked verifiable claims (vc's)
   * in the channel of the given ssid. Each act, fact and duty is stored in a separate vc.
   * Returns a list to the claim holding the whole model with links to individual claims
   * Note that references within the model are not translated into links.
   */
  async publish (ssid, flintModel, factFunctions = {}) {
    logger.debug('Publishing model')
    const core = this.abundance.getCoreAPI()
    const result = { model: flintModel.model, acts: [], facts: [], duties: [] }
    for (const fact of flintModel.facts) {
      let resultFact = fact
      if (fact.function === '[]' && factFunctions[fact.fact] != null) {
        logger.debug('Setting function for', fact.fact, 'to', factFunctions[fact.fact])

        resultFact = { ...fact, 'function': factFunctions[fact.fact] }
      }
      const link = await core.claim(ssid, { [DISCIPL_FLINT_FACT]: resultFact })
      result.facts.push({ [fact.fact]: link })
    }

    for (const act of flintModel.acts) {
      const link = await core.claim(ssid, { [DISCIPL_FLINT_ACT]: act })
      result.acts.push({ [act.act]: link })
    }
    for (const duty of flintModel.duties) {
      const link = await core.claim(ssid, { [DISCIPL_FLINT_DUTY]: duty })
      result.duties.push({ [duty.duty]: link })
    }

    logger.debug('Done publishing')
    return core.claim(ssid, { [DISCIPL_FLINT_MODEL]: result })
  }

  /**
   * @typedef ActionInformation
   * @property {string} act - Name of the act taken
   * @property {string} link - Link to the action
   */
  /**
   * Returns all the actions that have been taken in a case so far
   *
   * @param {string} caseLink - Link to the last action in the case
   * @param {object} ssid - Identity used to get access to information
   * @returns {Promise<ActionInformation[]>}
   */
  async getActions (caseLink, ssid) {
    const core = this.abundance.getCoreAPI()
    let actionLink = caseLink

    const acts = []

    while (actionLink != null) {
      const lastAction = await core.get(actionLink, ssid)
      const actLink = lastAction.data[DISCIPL_FLINT_ACT_TAKEN]

      if (actLink != null) {
        const act = await core.get(actLink, ssid)

        if (typeof act.data[DISCIPL_FLINT_ACT].act === 'string') {
          acts.unshift({ 'act': act.data[DISCIPL_FLINT_ACT].act, 'link': actionLink })
        }
      }
      actionLink = lastAction.data[DISCIPL_FLINT_PREVIOUS_CASE]
    }

    return acts
  }

  /**
   * Denotes a given act in the context of a case as taken, if it is possible. See {@link checkAction} is used to check the conditions
   *
   * @param {object} ssid - Identity of the actor
   * @param {string} caseLink - Link to the case, which is either an earlier action, or a need
   * @param {string} act - description of the act to be taken
   * @param {function} factResolver - Function used to resolve facts to fall back on if no other method is available. Defaults to always false
   * @returns {Promise<*>}
   */
  async take (ssid, caseLink, act, factResolver = () => false) {
    const core = this.abundance.getCoreAPI()

    const firstCaseLink = await this._getFirstCaseLink(caseLink, ssid)
    const modelLink = await this._getModelLink(firstCaseLink, ssid)

    const model = await core.get(modelLink, ssid)

    const actLink = await model.data[DISCIPL_FLINT_MODEL].acts.filter((actWithLink) => {
      return Object.keys(actWithLink).includes(act)
    }).map((actWithLink) => Object.values(actWithLink)[0])[0]

    if (actLink == null) {
      throw new Error('Act not found ' + act)
    }

    const factsSupplied = {}

    const defaultFactResolver = this._wrapWithDefault(factResolver, factsSupplied)

    logger.debug('Checking if action is possible from perspective of', ssid.did)
    const checkActionInfo = await this.checkAction(modelLink, actLink, ssid, { 'factResolver': defaultFactResolver, 'caseLink': caseLink }, true)
    if (checkActionInfo.valid) {
      logger.info('Registering act', actLink)
      return core.claim(ssid, { [DISCIPL_FLINT_ACT_TAKEN]: actLink,
        [DISCIPL_FLINT_GLOBAL_CASE]: firstCaseLink,
        [DISCIPL_FLINT_PREVIOUS_CASE]: caseLink,
        [DISCIPL_FLINT_FACTS_SUPPLIED]: factsSupplied })
    }

    throw new Error('Action ' + act + ' is not allowed')
  }

  /**
   *
   * @param {function} factResolver - Function used to resolve facts to fall back on if no other method is available
   * @param {Object} factsSupplied - Facts object
   * @return {function} factResolver - Function used to resolve facts to fall back on if no other method is available
   * @private
   */
  _wrapWithDefault (factResolver, factsSupplied) {
    return async (fact, flintItem, listNames, listIndices, possibleCreatingActions) => {
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
      const result = factsObject[fact] || maybeCreatingAction || factResolver(fact, flintItem, listNames, listIndices, possibleCreatingActions)
      factsObject[fact] = await result
      return result
    }
  }

  async _getModelLink (firstCaseLink, ssid) {
    const core = this.abundance.getCoreAPI()
    const firstCase = await core.get(firstCaseLink, ssid)

    const modelLink = firstCase.data['need'][DISCIPL_FLINT_MODEL_LINK]
    logger.debug('Determined model link to be', modelLink)
    return modelLink
  }

  async _getFirstCaseLink (caseLink, ssid) {
    const core = this.abundance.getCoreAPI()
    const caseClaim = await core.get(caseLink, ssid)
    const isFirstActionInCase = !Object.keys(caseClaim.data).includes(DISCIPL_FLINT_ACT_TAKEN)
    const firstCaseLink = isFirstActionInCase ? caseLink : caseClaim.data[DISCIPL_FLINT_GLOBAL_CASE]
    logger.debug('Determined first case link to be', firstCaseLink)
    return firstCaseLink
  }
}

export {
  LawReg,
  ModelValidator
}
