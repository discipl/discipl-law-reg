import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class MaxExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasUndefined = false
    let maxResult
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in MAX', operandResult, 'for operand', op)
      if (typeof maxResult === 'undefined' || operandResult > maxResult) {
        maxResult = operandResult
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const finalMaxResult = hasUndefined ? undefined : maxResult
    this.logger.debug('Resolved MAX as', finalMaxResult)
    this._getContextExplainer().extendContextExplanationWithResult(context, finalMaxResult)
    return finalMaxResult
  }
}
