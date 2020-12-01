import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class AndExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasUndefined = false
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in AND', operandResult, 'for operand', op)
      if (operandResult === false) {
        this.logger.debug('Resolved AND as false, because', op, 'is false')
        this._getContextExplainer().extendContextExplanationWithResult(context, false)
        return false
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const andResult = hasUndefined ? undefined : true
    this.logger.debug('Resolved AND as', andResult)
    this._getContextExplainer().extendContextExplanationWithResult(context, andResult)
    return andResult
  }
}
