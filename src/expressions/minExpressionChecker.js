import { getDiscplLogger } from '../utils/logging_util'

export class MinExpressionChecker {
  /**
   * Create a MinExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
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
    let hasUndefined = false
    let minResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in MIN', operandResult, 'for operand', op)
      if (typeof minResult === 'undefined' || operandResult < minResult) {
        minResult = operandResult
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const finalMinResult = hasUndefined ? undefined : minResult
    this.logger.debug('Resolved MIN as', String(finalMinResult))
    this._getContextExplainer().extendContextExplanationWithResult(context, finalMinResult)
    return finalMinResult
  }
}
