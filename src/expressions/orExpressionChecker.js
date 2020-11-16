import { getDiscplLogger } from '../utils/logging_util'

export class OrExpressionChecker {
  /**
   * Create an OrExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
    this.expression = 'OR'
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
   * Get context explainer
   * @return {ContextExplainer}
   * @private
   */
  _getContextExplainer () {
    return this.serviceProvider.contextExplainer
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)

      if (operandResult) {
        this.logger.debug('Resolved OR as true, because', op, 'is true')
        this._getContextExplainer().extendContextExplanationWithResult(context, true)
        return true
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }

    const orResult = hasUndefined ? undefined : false
    this._getContextExplainer().extendContextExplanationWithResult(context, orResult)
    this.logger.debug('Resolved OR as', orResult)
    return orResult
  }
}
