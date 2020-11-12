import { getDiscplLogger } from '../loggingUtil'

export class OrExpressionChecker {
  /**
   * Create an OrExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.expressionChecker = expressionChecker
    this.contextExplainer = contextExplainer
    this.logger = getDiscplLogger()
    this.expression = 'OR'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    for (const op of fact.operands) {
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)

      if (operandResult === true) {
        this.logger.debug('Resolved OR as true, because', op, 'is true')
        this.contextExplainer.extendContextExplanationWithResult(context, true)
        return true
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }

    const orResult = hasUndefined ? undefined : false
    this.contextExplainer.extendContextExplanationWithResult(context, orResult)
    this.logger.debug('Resolved OR as', orResult)
    return orResult
  }
}
