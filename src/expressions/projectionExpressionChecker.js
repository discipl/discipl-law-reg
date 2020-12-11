import { BaseSubExpressionChecker } from './baseSubExpressionChecker'
import { wrapWithDefault } from '../defaultFactResolver'
import { DISCIPL_FLINT_FACTS_SUPPLIED } from '../index'

export class ProjectionExpressionChecker extends BaseSubExpressionChecker {
  /**
   * Create a SubExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    super(serviceProvider)
    this.scopeCheckers = {
      'single': new SingleScopeProjectionExpressionChecker(serviceProvider),
      'all': new AllScopeProjectionExpressionChecker(serviceProvider),
      'some': new SomeScopeProjectionExpressionChecker(serviceProvider)
    }
  }

  async checkSubExpression (fact, ssid, context) {
    const scope = fact.scope ? fact.scope : 'single'
    this.logger.debug('Handling PROJECTION Expression with', scope, 'scope')
    return this.scopeCheckers[scope].checkSubExpression(fact, ssid, context)
  }
}

class BaseScopeProjectionExpressionChecker extends BaseSubExpressionChecker {
  _checkProjectionIsValid (fact) {
    if (!fact.context || fact.context.length === 0) {
      throw new Error('A \'context\' array must be given for the PROJECTION expression')
    }
    if (!fact.operand) {
      // TODO deprecate projection expression fact property
      if (fact.fact !== undefined) {
        fact.operand = fact.fact
      } else {
        throw new Error('A \'operand\' must be given for the PROJECTION expression')
      }
    }
  }

  /**
   * Get filtered creating acts
   * @param {object} fact - the create expression
   * @param {ssid} ssid - Identifies the actor
   * @param {Context} context - Context of the action
   * @return {Promise<Object<string, Object<string, *>>>} - Object where key is the act link and value is the provided facts
   * @protected
   */
  async _getCreatingActs (fact, ssid, context) {
    const contextFact = fact.context[0]
    const creatingActs = await this._getFactChecker().getCreatingActs(contextFact, ssid, context)
    const filteredActs = await this._filter(creatingActs, contextFact, ssid, context)
    const reducedActs = await Promise.all(Object.keys(filteredActs).map(key => this._reduce({ link: key, facts: filteredActs[key], contextFact: contextFact }, fact.context.slice(1), ssid)))
    return reducedActs.reduce((previousValue, currentValue) => {
      previousValue[currentValue.link] = currentValue.facts
      return previousValue
    }, {})
  }

  /**
   * @typedef CreatingAct
   * @property {string} link - Act link
   * @property {string} contextFact - The fact that was created by this act
   * @property {Object<string, *>} facts - Facts provided for act
   */

  /**
   * Reduce the create act using the context array to get the targets creating act
   * @param {CreatingAct}  creatingAct - The current creating act
   * @param {string[]} contextArray - The remaining context facts to reduce
   * @param {ssid} ssid - Identifies the actor
   * @return {Promise<CreatingAct>}
   * @protected
   */
  async _reduce (creatingAct, contextArray, ssid) {
    this.logger.debug('Case for', creatingAct.contextFact, 'is', creatingAct.link, 'with facts', creatingAct.facts)
    const contextFact = contextArray[0]
    const nextLink = creatingAct.facts[contextFact]
    if (nextLink) {
      const newCreatingAct = await this._getCreatingAct(nextLink, contextFact, ssid)
      return this._reduce(newCreatingAct, contextArray.slice(1), ssid)
    }
    return creatingAct
  }

  /**
   * Get creating act for an act link
   * @param {string} actLink - Act link
   * @param {string} contextFact - The fact that was created by this act
   * @param {ssid} ssid - Identifies the actor
   * @return {Promise<CreatingAct>}
   * @private
   */
  async _getCreatingAct (actLink, contextFact, ssid) {
    const actData = await this._getAbundanceService().getCoreAPI().get(actLink, ssid)
    const result = {}
    result.link = actLink
    result.contextFact = contextFact
    result.facts = actData.data[DISCIPL_FLINT_FACTS_SUPPLIED]
    return result
  }

  /**
   * Resolve the value of a fact
   * @param {object} fact - the create expression
   * @param {ssid} ssid - Identifies the actor
   * @param {Context} context - Context of the action
   * @param {Object<string, *>} providedFacts - the facts provided by the create expression
   * @return {Promise<*>}
   * @protected
   */
  async _resolve (fact, ssid, context, providedFacts) {
    const newContext = { ...context }
    newContext.factResolver = wrapWithDefault(context.factResolver, providedFacts)
    let result = await this._getFactChecker().checkFactWithResolver(fact.operand, ssid, newContext)
    // noinspection JSUnresolvedVariable
    if (typeof result === 'object' && result.expression) {
      result = await this._getFactChecker().checkFact(result, ssid, newContext)
    } else if (result === undefined) {
      result = await this._getFactChecker().checkFact(fact.operand, ssid, newContext)
    }
    return result
  }

  /**
   * Filter the creating acts (Should be implemented in sub expressions)
   * @param {Object<string, Object<string, *>>} creatingActs - the creating acts
   * @param {string} contextFact - the context fact
   * @param {ssid} ssid - Identifies the actor
   * @param {Context} context - Context of the action
   * @return {Promise<Object<string, Object<string, *>>>}
   * @protected
   */
  async _filter (creatingActs, contextFact, ssid, context) {
    throw new Error('Not implemented')
  }

  /**
   * Combine the values of creating acts into one provided facts object
   * @param {Object<string, Object<string, *>>} creatingActs - the creating acts
   * @return {Object<string, *[]>} - object where key is the fact and value is an array of the facts values
   * @protected
   */
  _toProvidedFacts (creatingActs) {
    const providedFacts = {}
    for (const key in creatingActs) {
      if (creatingActs.hasOwnProperty(key)) {
        for (const fact in creatingActs[key]) {
          if (creatingActs[key].hasOwnProperty(fact)) {
            const array = providedFacts[fact] ? providedFacts[fact] : []
            array.push(creatingActs[key][fact])
            providedFacts[fact] = array
          }
        }
      }
    }
    return providedFacts
  }
}

class SingleScopeProjectionExpressionChecker extends BaseScopeProjectionExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    this._checkProjectionIsValid(fact)
    const creatingActs = await this._getCreatingActs(fact, ssid, context)
    const creatingActsLinks = Object.keys(creatingActs)
    if (creatingActsLinks.length !== 1) {
      context.searchingFor = fact.operand
      return this._checkAtLeastTypeOf(fact.operand, ssid, context)
    }
    return this._resolve(fact, ssid, context, creatingActs[creatingActsLinks[0]])
  }

  /**
   * Check if current actor is an actor of type searchingFor
   * @param {string} searchingFor - The fact we are searching for
   * @param {ssid} ssid - Identifies the actor
   * @param {Context} context - Context of the action
   * @return {Promise<undefined|boolean>}
   * @private
   */
  async _checkAtLeastTypeOf (searchingFor, ssid, context) {
    if (context.myself) {
      this.logger.debug('Multiple creating acts found. Checking if you are at least a', searchingFor)
      const isActorType = await this._getFactChecker().checkFact(searchingFor, ssid, context)
      this.logger.debug('Resolved you are a', searchingFor, 'as', isActorType)
      return isActorType ? undefined : false
    }
    return undefined
  }

  /**
   * Filter the creating acts
   * @param {Object<string, Object<string, *>>} creatingActs - the creating acts
   * @param {string} contextFact - the context fact
   * @param {ssid} ssid - Identifies the actor
   * @param {Context} context - Context of the action
   * @return {Promise<Object<string, Object<string, *>>>}
   * @protected
   */
  async _filter (creatingActs, contextFact, ssid, context) {
    const linkValueKeys = Object.keys(creatingActs)
    const resolverLink = await this._getFactChecker().checkFactWithResolver(contextFact, ssid, context, linkValueKeys)
    const resolverLinks = [resolverLink]
    return Object.keys(creatingActs)
      .filter(key => resolverLinks.includes(key))
      .reduce((obj, key) => {
        obj[key] = creatingActs[key]
        return obj
      }, {})
  }
}

class AllScopeProjectionExpressionChecker extends BaseScopeProjectionExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    this._checkProjectionIsValid(fact)
    const creatingActs = await this._getCreatingActs(fact, ssid, context)
    const creatingActLinks = Object.keys(creatingActs)
    if (creatingActLinks.length <= 0) return false
    const providedFacts = this._toProvidedFacts(creatingActs)
    return this._resolve(fact, ssid, context, providedFacts)
  }

  /**
   * Filter the creating acts
   * @param {Object<string, Object<string, *>>} creatingActs - the creating acts
   * @param {string} contextFact - the context fact
   * @param {ssid} ssid - Identifies the actor
   * @param {Context} context - Context of the action
   * @return {Promise<Object<string, Object<string, *>>>}
   * @protected
   */
  async _filter (creatingActs, contextFact, ssid, context) {
    return creatingActs
  }
}

class SomeScopeProjectionExpressionChecker extends BaseScopeProjectionExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    this._checkProjectionIsValid(fact)
    const creatingActs = await this._getCreatingActs(fact, ssid, context)
    const creatingActLinks = Object.keys(creatingActs)
    if (creatingActLinks.length <= 0) return false
    const providedFacts = this._toProvidedFacts(creatingActs)
    return this._resolve(fact, ssid, context, providedFacts)
  }

  /**
   * Filter the creating acts
   * @param {Object<string, Object<string, *>>} creatingActs - the creating acts
   * @param {string} contextFact - the context fact
   * @param {ssid} ssid - Identifies the actor
   * @param {Context} context - Context of the action
   * @return {Promise<Object<string, Object<string, *>>>}
   * @protected
   */
  async _filter (creatingActs, contextFact, ssid, context) {
    const linkValueKeys = Object.keys(creatingActs)
    /**
     * @type {string[]}
     */
    let resolverLinks = await this._getFactChecker().checkFactWithResolver(contextFact, ssid, context, linkValueKeys)
    if (!Array.isArray(resolverLinks)) resolverLinks = []
    return Object.keys(creatingActs)
      .filter(key => resolverLinks.includes(key))
      .reduce((obj, key) => {
        obj[key] = creatingActs[key]
        return obj
      }, {})
  }
}
