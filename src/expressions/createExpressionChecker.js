import { getDiscplLogger } from '../loggingUtil'

export class CreateExpressionChecker {
  /**
   * Create a CreateExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
    this.expression = 'CREATE'
  }

  /**
   * Get expression checker
   * @return {ExpressionChecker}
   */
  _getExpressionChecker () {
    return this.serviceProvider.expressionChecker
  }

  /**
   * Get context explainer
   * @return {ContextExplainer}
   */
  _getContextExplainer () {
    return this.serviceProvider.contextExplainer
  }

  /**
   * Get fact checker
   * @return {FactChecker}
   */
  _getFactChecker () {
    return this.serviceProvider.factChecker
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let finalCreateResult = await this._getFactChecker().checkCreatedFact(context.previousFact, ssid, context)

    if (!finalCreateResult || !fact.operands) {
      this.logger.debug('Resolving fact', fact, 'as', finalCreateResult, 'by determining earlier creation')

      this._getContextExplainer().extendContextExplanationWithResult(context, finalCreateResult)
      return finalCreateResult
    }

    for (const op of fact.operands) {
      let factExists = await this._getFactChecker().checkFactProvidedInAct(op, ssid, context)
      if (!factExists) {
        factExists = await this._getFactChecker().checkFact(op, ssid, context)
      }
      if (!factExists) {
        finalCreateResult = false
        break
      }
    }

    this.logger.debug('Resolving fact', fact, 'as', finalCreateResult, 'by determining earlier creation')
    this._getContextExplainer().extendContextExplanationWithResult(context, finalCreateResult)

    return finalCreateResult
  }
}
