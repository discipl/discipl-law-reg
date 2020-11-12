import { getDiscplLogger } from '../loggingUtil'
import { BigUtil } from '../big_util'

export class SumExpressionChecker {
  /**
   * Create a SumExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'SUM'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    let sumResult = 0
    for (const op of fact.operands) {
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in SUM', String(operandResult), 'for operand', op)
      if (Array.isArray(operandResult)) {
        for (const arrayOp of operandResult) {
          if (arrayOp) {
            sumResult = BigUtil.add(sumResult, arrayOp)
          }
        }
      } else {
        sumResult = BigUtil.add(sumResult, operandResult)
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const finalSumResult = hasUndefined ? undefined : sumResult
    this.logger.debug('Resolved SUM as', String(finalSumResult))
    this.contextExplainer.extendContextExplanationWithResult(context, finalSumResult)
    return finalSumResult
  }
}
