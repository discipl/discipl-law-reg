import { BaseSubExpressionChecker } from './baseSubExpressionChecker'
import { BigUtil } from '../utils/big_util'

export class MinExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let minResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in MIN', operandResult, 'for operand', op)
      if (operandResult === undefined) {
        minResult = undefined
        break
      } else if (!BigUtil.isNumeric(operandResult)) {
        minResult = false
        break
      } else if (!BigUtil.isNumeric(minResult) || BigUtil.lessThan(operandResult, minResult)) {
        minResult = operandResult
      }
    }
    this.logger.debug('Resolved MIN as', String(minResult))
    this._getContextExplainer().extendContextExplanationWithResult(context, minResult)
    return minResult
  }
}
