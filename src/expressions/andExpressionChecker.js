import { getDiscplLogger } from '../loggingUtil'

export class AndExpressionChecker {
  /**
   * Create an AndExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
    this.expression = 'AND'
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

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in AND', operandResult, 'for operand', op)
      if (operandResult === false) {
        this.logger.debug('Resolved AND as false, because', op, 'is false')
        this._getContextExplainer().extendContextExplanationWithResult(context, false)
        return false
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const andResult = hasUndefined ? undefined : true
    this.logger.debug('Resolved AND as', andResult)
    this._getContextExplainer().extendContextExplanationWithResult(context, andResult)
    return andResult
  }
}
