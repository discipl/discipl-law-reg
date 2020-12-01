import { BaseSubExpressionChecker } from './baseSubExpressionChecker'
import { BigUtil } from '../utils/big_util'

export class MaxExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasNonNumeric = false
    let maxResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in MAX', operandResult, 'for operand', op)
      if (!BigUtil.isNumeric(operandResult)) {
        hasNonNumeric = true
        continue
      }
      if (!BigUtil.isNumeric(maxResult) || BigUtil.greaterThan(operandResult, maxResult)) {
        maxResult = operandResult
      }
    }
    const finalMaxResult = hasNonNumeric ? undefined : maxResult
    this.logger.debug('Resolved MAX as', finalMaxResult)
    this._getContextExplainer().extendContextExplanationWithResult(context, finalMaxResult)
    return finalMaxResult
  }
}
