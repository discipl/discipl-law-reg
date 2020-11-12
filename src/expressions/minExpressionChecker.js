import { getDiscplLogger } from '../loggingUtil'

export class MinExpressionChecker {
  /**
   * Create a MinExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'MIN'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    let minResult
    for (const op of fact.operands) {
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in MIN', operandResult, 'for operand', op)
      if (typeof minResult === 'undefined' || operandResult < minResult) {
        minResult = operandResult
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const finalMinResult = hasUndefined ? undefined : minResult
    this.logger.debug('Resolved MIN as', String(finalMinResult))
    this.contextExplainer.extendContextExplanationWithResult(context, finalMinResult)
    return finalMinResult
  }
}
