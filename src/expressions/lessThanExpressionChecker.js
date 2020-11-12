import { getDiscplLogger } from '../loggingUtil'
import { BigUtil } from '../big_util'

export class LessThanExpressionChecker {
  /**
   * Create a LessThanExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'LESS_THAN'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug('Switch case: LESS_THAN')
    let hasUndefined = false
    let lastOperandResult
    for (const op of fact.operands) {
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in LESS_THAN', operandResult, 'for operand', op)
      if (typeof lastOperandResult !== 'undefined' && typeof operandResult !== 'undefined') {
        if (BigUtil.lessThan(operandResult, lastOperandResult)) {
          this.logger.debug('Resolved LESS_THAN as false, because', String(lastOperandResult), 'is not less than', String(operandResult))
          this.contextExplainer.extendContextExplanationWithResult(context, false)
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
    this.contextExplainer.extendContextExplanationWithResult(context, lessThanResult)
    return lessThanResult
  }
}