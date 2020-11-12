import { getDiscplLogger } from '../loggingUtil'

export class NotExpressionChecker {
  /**
   * Create a NotExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'NOT'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    const newContext = this.contextExplainer.extendContextWithExplanation(context)
    const value = await this.expressionChecker.checkExpression(fact.operand, ssid, newContext)
    const notResult = typeof value === 'boolean' ? !value : undefined
    this.contextExplainer.extendContextExplanationWithResult(context, notResult)
    return notResult
  }
}
