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
   * // TODO
   * @param fact
   * @param ssid
   * @param context
   * @return {Promise<*>}
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
   * // TODO
   * @param creatingAct
   * @param contextArray
   * @param ssid
   * @return {Promise<*>}
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
   * // TODO
   * @param actLink
   * @param ssid
   * @return {Promise<{}>}
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
   * // TODO
   * @param fact
   * @param ssid
   * @param context
   * @param providedFacts
   * @return {Promise<*>}
   * @protected
   */
  async _resolve (fact, ssid, context, providedFacts) {
    const newContext = { ...context }
    newContext.factResolver = wrapWithDefault(context.factResolver, providedFacts)
    let result = await this._getFactChecker().checkFactWithResolver(fact.operand, ssid, newContext)
    if (typeof result === 'object' && result.expression) {
      result = await this._getFactChecker().checkFact(result, ssid, newContext)
    } else if (result === undefined) {
      result = await this._getFactChecker().checkFact(fact.operand, ssid, newContext)
    }
    return result
  }

  /**
   * // TODO
   * @param creatingActs
   * @param contextFact
   * @param ssid
   * @param context
   * @return {Promise<object[]>}
   * @protected
   */
  async _filter (creatingActs, contextFact, ssid, context) {
    throw new Error('Not implemented')
  }

  /**
   * // TODO
   * @param linkValues
   * @return {{}}
   * @protected
   */
  _combineLinkValues (linkValues) {
    const providedFacts = {}
    for (const key in linkValues) {
      if (linkValues.hasOwnProperty(key)) {
        for (const fact in linkValues[key]) {
          if (linkValues[key].hasOwnProperty(fact)) {
            const array = providedFacts[fact] ? providedFacts[fact] : []
            array.push(linkValues[key][fact])
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

  async _checkAtLeastTypeOf (searchingFor, ssid, context) {
    if (context.myself) {
      this.logger.debug('Multiple creating acts found. Checking if you are at least a', searchingFor)
      const isActorType = await this._getFactChecker().checkFact(searchingFor, ssid, context)
      this.logger.debug('Resolved you are a', searchingFor, 'as', isActorType)
      return isActorType ? undefined : false
    }
    return undefined
  }

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
    const providedFacts = this._combineLinkValues(creatingActs)
    return this._resolve(fact, ssid, context, providedFacts)
  }

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
    const providedFacts = this._combineLinkValues(creatingActs)
    return this._resolve(fact, ssid, context, providedFacts)
  }

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
