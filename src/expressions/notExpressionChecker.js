import { getDiscplLogger } from '../loggingUtil'

export class NotExpressionChecker {
  /**
   * Create a NotExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
    this.expression = 'NOT'
  }

  /**
   * Get expression checker
   * @return {ExpressionChecker}
   */
  _getExpressionChecker () {
    return this.serviceProvider.expressionChecker
  }

  /**
   * Get context explainer
   * @return {ContextExplainer}
   */
  _getContextExplainer () {
    return this.serviceProvider.contextExplainer
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    const newContext = this._getContextExplainer().extendContextWithExplanation(context)
    const value = await this._getExpressionChecker().checkExpression(fact.operand, ssid, newContext)
    const notResult = typeof value === 'boolean' ? !value : undefined
    this._getContextExplainer().extendContextExplanationWithResult(context, notResult)
    return notResult
  }
}
