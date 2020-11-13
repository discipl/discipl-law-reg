import { getDiscplLogger } from '../loggingUtil'
import { BigUtil } from '../big_util'

export class LessThanExpressionChecker {
  /**
   * Create a LessThanExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
    this.expression = 'LESS_THAN'
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
    let lastOperandResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in LESS_THAN', operandResult, 'for operand', op)
      if (typeof lastOperandResult !== 'undefined' && typeof operandResult !== 'undefined') {
        if (BigUtil.lessThan(operandResult, lastOperandResult)) {
          this.logger.debug('Resolved LESS_THAN as false, because', String(lastOperandResult), 'is not less than', String(operandResult))
          this._getContextExplainer().extendContextExplanationWithResult(context, false)
          return false
        }
      }

      lastOperandResult = operandResult

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const lessThanResult = hasUndefined ? undefined : true
    this.logger.debug('Resolved LESS_THAN as', String(lessThanResult))
    this._getContextExplainer().extendContextExplanationWithResult(context, lessThanResult)
    return lessThanResult
  }
}
