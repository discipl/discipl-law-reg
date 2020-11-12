import { getDiscplLogger } from '../loggingUtil'

export class ListExpressionChecker {
  /**
   * Create a ListExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'LIST'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug('Switch case: LIST')
    let hasUndefined = false
    if (!context.listNames) {
      context.listNames = []
      context.listIndices = []
    }
    context.listNames.push(fact.name)

    const listIndex = context.listIndices.push(0) - 1
    const listContentResult = []
    while (true) {
      const op = fact.items
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in LIST', operandResult, 'for operand', op, 'and index', context.listIndices[listIndex])

      listContentResult.push(operandResult)

      if (operandResult === false) {
        this.logger.debug('Stopping LIST concatenation, because', op, 'is false')
        break
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
        break
      }

      context.listIndices[listIndex] += 1
    }

    context.listNames.pop()
    const resultIndex = context.listIndices.pop()

    const listResult = hasUndefined ? undefined : (resultIndex !== 0 ? listContentResult : false)
    this.logger.debug('Resolved LIST as', listResult)
    this.contextExplainer.extendContextExplanationWithResult(context, listResult)
    return listResult
  }
}
