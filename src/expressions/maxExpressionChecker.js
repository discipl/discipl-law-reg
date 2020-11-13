import { getDiscplLogger } from '../utils/logging_util'

export class MaxExpressionChecker {
  /**
   * Create a MaxExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
    this.expression = 'MAX'
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
    let maxResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in MAX', operandResult, 'for operand', op)
      if (typeof maxResult === 'undefined' || operandResult > maxResult) {
        maxResult = operandResult
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const finalMaxResult = hasUndefined ? undefined : maxResult
    this.logger.debug('Resolved MAX as', finalMaxResult)
    this._getContextExplainer().extendContextExplanationWithResult(context, finalMaxResult)
    return finalMaxResult
  }
}
