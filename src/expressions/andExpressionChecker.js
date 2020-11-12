import { getDiscplLogger } from '../loggingUtil'

export class AndExpressionChecker {
  /**
   * Create an AndExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'AND'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    for (const op of fact.operands) {
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in AND', operandResult, 'for operand', op)
      if (operandResult === false) {
        this.logger.debug('Resolved AND as false, because', op, 'is false')
        this.contextExplainer.extendContextExplanationWithResult(context, false)
        return false
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const andResult = hasUndefined ? undefined : true
    this.logger.debug('Resolved AND as', andResult)
    this.contextExplainer.extendContextExplanationWithResult(context, andResult)
    return andResult
  }
}
