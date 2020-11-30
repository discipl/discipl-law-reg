import { getDiscplLogger } from '../utils/logging_util'

export class NotExpressionChecker {
  /**
   * Create a NotExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
  }

  /**
   * Get expression checker
   * @return {ExpressionChecker}
   * @private
   */
  _getExpressionChecker () {
    return this.serviceProvider.expressionChecker
  }

  /**
   * Get context explainer
   * @return {ContextExplainer}
   * @private
   */
  _getContextExplainer () {
    return this.serviceProvider.contextExplainer
  }

  async checkSubExpression (fact, ssid, context) {
    const newContext = this._getContextExplainer().extendContextWithExplanation(context)
    const value = await this._getExpressionChecker().checkExpression(fact.operand, ssid, newContext)
    const notResult = typeof value === 'boolean' ? !value : undefined
    this._getContextExplainer().extendContextExplanationWithResult(context, notResult)
    return notResult
  }
}
