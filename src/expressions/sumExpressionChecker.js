import { BigUtil } from '../utils/big_util'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class SumExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasUndefined = false
    let sumResult = 0
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
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
    this._getContextExplainer().extendContextExplanationWithResult(context, finalSumResult)
    return finalSumResult
  }
}
