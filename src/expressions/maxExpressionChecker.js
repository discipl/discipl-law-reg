import { getDiscplLogger } from '../loggingUtil'

export class MaxExpressionChecker {
  /**
   * Create a MaxExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'MAX'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    this.logger.debug('Switch case: MAX')
    let maxResult
    for (const op of fact.operands) {
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)
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
    this.contextExplainer.extendContextExplanationWithResult(context, finalMaxResult)
    return finalMaxResult
  }
}
