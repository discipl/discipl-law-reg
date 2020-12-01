import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class OrExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasUndefined = false
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)

      if (operandResult === true) {
        this.logger.debug('Resolved OR as true, because', op, 'is true')
        this._getContextExplainer().extendContextExplanationWithResult(context, true)
        return true
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }

    const orResult = hasUndefined ? undefined : false
    this._getContextExplainer().extendContextExplanationWithResult(context, orResult)
    this.logger.debug('Resolved OR as', orResult)
    return orResult
  }
}
