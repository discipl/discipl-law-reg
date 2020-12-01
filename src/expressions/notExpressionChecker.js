import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class NotExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    const newContext = this._getContextExplainer().extendContextWithExplanation(context)
    const value = await this._getExpressionChecker().checkExpression(fact.operand, ssid, newContext)
    const notResult = typeof value === 'boolean' ? !value : undefined
    this._getContextExplainer().extendContextExplanationWithResult(context, notResult)
    return notResult
  }
}
