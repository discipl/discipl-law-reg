import { BigUtil } from '../utils/big_util'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class LessThanExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasNonNumeric = false
    let lastOperandResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in LESS_THAN', operandResult, 'for operand', op)
      if (BigUtil.isNumeric(lastOperandResult) && BigUtil.isNumeric(operandResult)) {
        if (BigUtil.lessThan(operandResult, lastOperandResult)) {
          this.logger.debug('Resolved LESS_THAN as false, because', String(lastOperandResult), 'is not less than', String(operandResult))
          this._getContextExplainer().extendContextExplanationWithResult(context, false)
          return false
        }
      }

      lastOperandResult = operandResult

      if (!BigUtil.isNumeric(operandResult)) {
        hasNonNumeric = true
      }
    }
    const lessThanResult = hasNonNumeric ? undefined : true
    this.logger.debug('Resolved LESS_THAN as', String(lessThanResult))
    this._getContextExplainer().extendContextExplanationWithResult(context, lessThanResult)
    return lessThanResult
  }
}
