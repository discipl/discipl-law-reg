import { BigUtil } from '../utils/big_util'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class EqualExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let lastOperandResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in EQUAL', String(operandResult), 'for operand', op)
      if (operandResult === undefined) {
        this.logger.debug('Resolved EQUAL as undefined because one of the operands was undefined')
        lastOperandResult = undefined
        break
      } else if (lastOperandResult !== undefined && !BigUtil.equal(operandResult, lastOperandResult)) {
        this.logger.debug('Resolved EQUAL as false, because', String(lastOperandResult), 'does not equal', String(operandResult))
        lastOperandResult = false
        break
      } else {
        lastOperandResult = operandResult
      }
    }
    const equalResult = lastOperandResult === undefined ? undefined : lastOperandResult !== false
    if (equalResult) {
      this.logger.debug('Resolved EQUAL as', String(equalResult))
    }
    this._getContextExplainer().extendContextExplanationWithResult(context, equalResult)
    return equalResult
  }
}
