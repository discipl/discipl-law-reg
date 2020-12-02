import { BaseSubExpressionChecker } from './baseSubExpressionChecker'
import { BigUtil } from '../utils/big_util'

export class MaxExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let maxResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in MAX', operandResult, 'for operand', op)
      if (operandResult === undefined) {
        maxResult = undefined
        break
      } else if (!BigUtil.isNumeric(operandResult)) {
        maxResult = false
        break
      } else if (!BigUtil.isNumeric(maxResult) || BigUtil.greaterThan(operandResult, maxResult)) {
        maxResult = operandResult
      }
    }
    this.logger.debug('Resolved MAX as', maxResult)
    this._getContextExplainer().extendContextExplanationWithResult(context, maxResult)
    return maxResult
  }
}
