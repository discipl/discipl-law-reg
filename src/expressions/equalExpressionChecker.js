import { getDiscplLogger } from '../loggingUtil'
import { BigUtil } from '../big_util'

export class EqualExpressionChecker {
  /**
   * Create a EqualExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'EQUAL'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    let lastEqualOperandResult
    for (const op of fact.operands) {
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in EQUAL', String(operandResult), 'for operand', op)
      if (typeof lastEqualOperandResult !== 'undefined' && typeof operandResult !== 'undefined') {
        if (!BigUtil.equal(operandResult, lastEqualOperandResult)) {
          this.logger.debug('Resolved EQUAL as false, because', String(lastEqualOperandResult), 'does not equal', String(operandResult))
          this.contextExplainer.extendContextExplanationWithResult(context, false)
          return false
        }
      }

      lastEqualOperandResult = operandResult

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const equalResult = hasUndefined ? undefined : true
    this.logger.debug('Resolved EQUAL as', String(equalResult))
    this.contextExplainer.extendContextExplanationWithResult(context, equalResult)
    return equalResult
  }
}
