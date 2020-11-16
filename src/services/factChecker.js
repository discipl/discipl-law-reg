import Big from 'big.js'
import { DISCIPL_FLINT_ACT, DISCIPL_FLINT_ACT_TAKEN, DISCIPL_FLINT_FACT, DISCIPL_FLINT_FACTS_SUPPLIED, DISCIPL_FLINT_PREVIOUS_CASE } from '../index'
import { getDiscplLogger } from '../utils/logging_util'
// Improve intelisense
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'

export class FactChecker {
  /**
   * Create a ExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.logger = getDiscplLogger()
    this.serviceProvider = serviceProvider
  }

  /**
   * Get abundance service
   * @return {AbundanceService}
   * @private
   */
  getAbundanceService () {
    return this.serviceProvider.abundanceService
  }

  /**
   * Get expression checker
   * @return {ExpressionChecker}
   * @private
   */
  _getExpressionChecker () {
    return this.serviceProvider.expressionChecker
  }

  /**
   * Get expression checker
   * @return {ContextExplainer}
   * @private
   */
  _getContextExplainer () {
    return this.serviceProvider.contextExplainer
  }

  /**
   * Checks a fact by doing
   * 1. A lookup in the fact reference
   * 2. Checking if it is an expression, and parsing it
   *   a. If it is a simple expression, pass to the factResolver
   *   b. If it is a complex expression, parse it and evaluate it by parts
   *
   * @param {string|object} fact - fact or expression
   * @param {ssid} ssid - ssid representing the actor
   * @param {Context} context -
   * @returns {Promise<boolean>} - result of the fact
   */
  async checkFact (fact, ssid, context) {
    this.logger.debug('Checking fact', fact)
    const factLink = context.facts ? context.facts[fact] : null

    const printResult = (aResult) => this.logger.debug('Resolved', fact, 'as', aResult)
    if (factLink) {
      if (context.explanation) {
        context.explanation.fact = fact
      }
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const result = await this._checkFactLink(factLink, fact, ssid, newContext)

      this._getContextExplainer().extendContextExplanationWithResult(context, result)
      printResult(result)
      return result
    }

    if (typeof fact === 'string') {
      if (context.explanation) {
        context.explanation.fact = fact
      }
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const result = await this.checkFactWithResolver(fact, ssid, newContext)
      this._getContextExplainer().extendContextExplanationWithResult(context, result)
      printResult(result)
      return result
    } else {
      const result = await this._getExpressionChecker().checkExpression(fact, ssid, context)
      this._getContextExplainer().extendContextExplanationWithResult(context, result)
      printResult(result)
      return result
    }
  }

  /**
   * Checks a fact by using the factResolver from the context.
   * If an empty fact is to be checked, this is because a reference was followed. in this case we fall back
   * to the previousFact, which likely contains information that can be used to resolve this.
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {ssid} ssid - Identity of entity doing the checking
   * @param {Context} context - context of the checking
   * @returns {Promise<boolean>}
   */
  async checkFactWithResolver (fact, ssid, context) {
    const factToCheck = fact === '[]' || fact === '' ? context.previousFact : fact
    const listNames = context.listNames || []
    const listIndices = context.listIndices || []
    const result = context.factResolver(factToCheck, listNames, listIndices)
    let resolvedResult = await Promise.resolve(result)
    if (typeof resolvedResult === 'number') {
      resolvedResult = Big(resolvedResult)
    }

    this.logger.debug('Resolving fact', fact, 'as', String(resolvedResult), 'via', factToCheck, 'by factresolver')
    this._getContextExplainer().extendContextExplanationWithResult(context, resolvedResult)
    return resolvedResult
  }

  /**
   * Checks a fact link by checking created objects and passing the function to {@link checkFact}
   *
   * @param {string} factLink - Link to the fact
   * @param {string} fact - Name of the fact
   * @param {ssid} ssid - Identity of the entity performing the check
   * @param {Context} context - Represents the context of the check
   * @returns {Promise<boolean>}
   * @private
   */
  async _checkFactLink (factLink, fact, ssid, context) {
    const core = this.getAbundanceService().getCoreAPI()
    const factReference = await core.get(factLink, ssid)
    const functionRef = factReference.data[DISCIPL_FLINT_FACT].function

    const result = await this.checkFact(functionRef, ssid, { ...context, previousFact: fact })
    this._getContextExplainer().extendContextExplanationWithResult(context, result)
    return result
  }

  /**
   * Checks if a fact was created in a act that wasn't terminated yet that the given entity has access to.
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {ssid} ssid - Identity of entity doing the checking
   * @param {Context} context - context of the checking
   * @returns {Promise<boolean>} - true if the fact has been created
   */
  async checkCreatedFact (fact, ssid, context) {
    this.logger.debug('Checking if', fact, 'was created')
    const creatingActions = Object.keys(await this._getCreatingActs(fact, ssid, context))
    if (creatingActions.length === 0) {
      return false
    }

    const result = context.factResolver(fact, context.listNames || [], context.listIndices || [], creatingActions)
    const resolvedResult = await Promise.resolve(result)

    if (!creatingActions.includes(resolvedResult) && typeof resolvedResult !== 'undefined') {
      throw new Error('Invalid choice for creating action: ' + resolvedResult)
    }

    if (typeof resolvedResult === 'undefined' && context.myself) {
      const actorType = context.searchingFor
      this.logger.debug('Multiple creating acts found. Checking if you are at least a', actorType)
      const isActorType = await this.checkFact(actorType, ssid, context)
      this.logger.debug('Resolved you are a', actorType, 'as', isActorType)
      return isActorType ? undefined : false
    }

    return resolvedResult
  }

  /**
   * Checks if a given fact was provided in an act that wasn't terminated yet that the given entity has access to.
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {ssid} ssid - Identity of entity doing the checking
   * @param {Context} context - context of the checking
   * @returns {Promise<object>} - the facts value or false if it hasn't been provided
   */
  async checkFactProvidedInAct (fact, ssid, context) {
    this.logger.debug('Checking if', fact, 'was provided in an action')
    const creatingActions = await this._getCreatingActs(context.previousFact, ssid, context)
    if (Object.keys(creatingActions).length !== 0) {
      const actionWithTheFact = Object.values(creatingActions).find((value) => value[fact] !== undefined)
      if (actionWithTheFact !== undefined) {
        const theFact = actionWithTheFact[fact]
        this.logger.debug('fact', fact, 'was provided as', theFact)
        return theFact
      }
    }
    this.logger.debug('fact', fact, 'was not provided')
    return false
  }

  /**
   * Get all creating acts where the fact was created and not terminated yet
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {ssid} ssid - Identity of entity getting the acts
   * @param {Context} context - context of the getting
   * @returns {Promise<object>} - Object where the keys are the found act case links and the values are the provided facts.
   * @private
   */
  async _getCreatingActs (fact, ssid, context) {
    this.logger.debug('Getting creating actions for', fact)
    const core = this.getAbundanceService().getCoreAPI()
    let caseLink = context.caseLink
    const possibleCreatingActions = {}
    const terminatedCreatingActions = []

    while (caseLink != null) {
      const caseData = await core.get(caseLink, ssid)
      const lastTakenAction = caseData.data[DISCIPL_FLINT_ACT_TAKEN]

      if (lastTakenAction != null) {
        const actData = await core.get(lastTakenAction, ssid)
        const act = actData.data[DISCIPL_FLINT_ACT]
        this.logger.debug('Found earlier act', act.act)

        if (act.create != null && act.create.includes(fact)) {
          possibleCreatingActions[caseLink] = caseData.data[DISCIPL_FLINT_FACTS_SUPPLIED]
        }

        if (act.terminate != null && act.terminate.includes(fact)) {
          const terminatedLink = caseData.data[DISCIPL_FLINT_FACTS_SUPPLIED][fact]
          terminatedCreatingActions.push(terminatedLink)
        }
      }
      caseLink = caseData.data[DISCIPL_FLINT_PREVIOUS_CASE]
    }

    const filtered = Object
      .keys(possibleCreatingActions)
      .filter(key => !terminatedCreatingActions.includes(key))
      .reduce(
        (obj, key) => {
          obj[key] = possibleCreatingActions[key]
          return obj
        },
        {}
      )

    this.logger.debug('Creating acts', filtered)
    return filtered
  }
}
