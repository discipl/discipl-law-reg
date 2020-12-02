import { BigUtil } from '../utils/big_util'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class SumExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let sumResult = 0
    for (const op of fact.operands) {
      if (!BigUtil.isNumeric(sumResult)) { break }
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in SUM', String(operandResult), 'for operand', op)
      const opArray = Array.isArray(operandResult) ? operandResult : [operandResult]
      for (const arrayOp of opArray) {
        this.logger.debug('ArrayOperandResult in SUM', String(arrayOp), 'for operand', op)
        if (arrayOp === undefined) {
          sumResult = undefined
          break
        } else if (!BigUtil.isNumeric(arrayOp)) {
          sumResult = false
          break
        } else {
          sumResult = BigUtil.add(sumResult, arrayOp)
        }
      }
    }
    this.logger.debug('Resolved SUM as', String(sumResult))
    this._getContextExplainer().extendContextExplanationWithResult(context, sumResult)
    return sumResult
  }
}
