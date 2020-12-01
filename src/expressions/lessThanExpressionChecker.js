import { BigUtil } from '../utils/big_util'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class LessThanExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let lastOperandResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in LESS_THAN', operandResult, 'for operand', op)
      if (operandResult === undefined) {
        this.logger.debug('Resolved LESS_THAN as undefined because one of the operands was undefined')
        lastOperandResult = undefined
        break
      } else if (!BigUtil.isNumeric(operandResult)) {
        this.logger.debug('Resolved LESS_THAN as false because', String(operandResult), 'is not numeric')
        lastOperandResult = false
        break
      } else if (lastOperandResult !== undefined && BigUtil.lessThan(operandResult, lastOperandResult)) {
        this.logger.debug('Resolved LESS_THAN as false, because', String(lastOperandResult), 'is not less than', String(operandResult))
        lastOperandResult = false
        break
      } else {
        lastOperandResult = operandResult
      }
    }
    const lessThanResult = lastOperandResult !== false
    if (lessThanResult) {
      this.logger.debug('Resolved LESS_THAN as', String(lessThanResult))
    }
    this._getContextExplainer().extendContextExplanationWithResult(context, lessThanResult)
    return lessThanResult
  }
}
