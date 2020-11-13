import { getDiscplLogger } from '../utils/logging_util'

export class ListExpressionChecker {
  /**
   * Create a ListExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
    this.expression = 'LIST'
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
    this.logger.debug(`Handling: ${this.expression}`)
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
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
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
    this._getContextExplainer().extendContextExplanationWithResult(context, listResult)
    return listResult
  }
}
