import { BaseSubExpressionChecker } from './baseSubExpressionChecker'
import { BigUtil } from '../utils/big_util'

export class MinExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasNonNumeric = false
    let minResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in MIN', operandResult, 'for operand', op)
      if (!BigUtil.isNumeric(operandResult)) {
        hasNonNumeric = true
        continue
      }
      if (!BigUtil.isNumeric(minResult) || BigUtil.lessThan(operandResult, minResult)) {
        minResult = operandResult
      }
    }
    const finalMinResult = hasNonNumeric ? undefined : minResult
    this.logger.debug('Resolved MIN as', String(finalMinResult))
    this._getContextExplainer().extendContextExplanationWithResult(context, finalMinResult)
    return finalMinResult
  }
}
