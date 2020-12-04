import { BaseSubExpressionChecker } from './baseSubExpressionChecker'
import { wrapWithDefault } from '../defaultFactResolver'

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
    return this.scopeCheckers[scope].checkSubExpression(fact, ssid, context)
  }
}

class BaseScopeProjectionExpressionChecker extends BaseSubExpressionChecker {
  _checkProjectionIsValid (fact) {
    // TODO current solution only requires last entry in context array so maybe this should just be a single property
    if (!fact.context || fact.context.length === 0) {
      throw new Error('A \'context\' array must be given for the PROJECTION expression')
    }
    fact.context = fact.context[fact.context.length - 1]
    if (!fact.operand) {
      // TODO deprecate projection expression fact property
      if (fact.fact !== undefined) {
        fact.operand = fact.fact
      } else {
        throw new Error('A \'operand\' must be given for the PROJECTION expression')
      }
    }
  }

  async _getCreatingActs (fact, ssid, context) {
    return this._getFactChecker().getCreatingActs(fact.context, ssid, context)
  }

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
    const linkValues = await this._getCreatingActs(fact, ssid, context)
    const linkValueKeys = Object.keys(linkValues)
    if (linkValueKeys.length <= 0) return false
    const resolverLink = await this._getFactChecker().checkFactWithResolver(fact.context, ssid, context, linkValueKeys)
    let providedFacts
    if (linkValues[resolverLink]) {
      providedFacts = linkValues[resolverLink]
    } else if (linkValueKeys.length === 1) {
      providedFacts = linkValues[linkValueKeys[0]]
    } else {
      context.searchingFor = fact.operand
      return this._checkAtLeastTypeOf(fact.operand, ssid, context)
    }
    return this._resolve(fact, ssid, context, providedFacts)
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
}

class AllScopeProjectionExpressionChecker extends BaseScopeProjectionExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    this._checkProjectionIsValid(fact)
    const linkValues = await this._getCreatingActs(fact, ssid, context)
    const linkValueKeys = Object.keys(linkValues)
    if (linkValueKeys.length <= 0) return false
    const providedFacts = this._combineLinkValues(linkValues)
    return this._resolve(fact, ssid, context, providedFacts)
  }
}

class SomeScopeProjectionExpressionChecker extends BaseScopeProjectionExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    this._checkProjectionIsValid(fact)
    let linkValues = await this._getCreatingActs(fact, ssid, context)
    const linkValueKeys = Object.keys(linkValues)
    if (linkValueKeys.length <= 0) return false
    /**
     * @type {string[]}
     */
    let resolverLinks = await this._getFactChecker().checkFactWithResolver(fact.context, ssid, context, linkValueKeys)
    if (!Array.isArray(resolverLinks)) resolverLinks = []
    linkValues = Object.keys(linkValues)
      .filter(key => resolverLinks.includes(key))
      .reduce((obj, key) => {
        obj[key] = linkValues[key]
        return obj
      }, {})
    const providedFacts = this._combineLinkValues(linkValues)
    return this._resolve(fact, ssid, context, providedFacts)
  }
}
