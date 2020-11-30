import { BigUtil } from '../utils/big_util'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class EqualExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasUndefined = false
    let lastEqualOperandResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in EQUAL', String(operandResult), 'for operand', op)
      if (typeof lastEqualOperandResult !== 'undefined' && typeof operandResult !== 'undefined') {
        if (!BigUtil.equal(operandResult, lastEqualOperandResult)) {
          this.logger.debug('Resolved EQUAL as false, because', String(lastEqualOperandResult), 'does not equal', String(operandResult))
          this._getContextExplainer().extendContextExplanationWithResult(context, false)
          return false
        }
      }

      lastEqualOperandResult = operandResult

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const equalResult = hasUndefined ? undefined : true
    this.logger.debug('Resolved EQUAL as', String(equalResult))
    this._getContextExplainer().extendContextExplanationWithResult(context, equalResult)
    return equalResult
  }
}
