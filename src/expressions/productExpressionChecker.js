import { getDiscplLogger } from '../loggingUtil'
import { BigUtil } from '../big_util'

export class ProductExpressionChecker {
  /**
   * Create a ProductExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'PRODUCT'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let hasUndefined = false
    let productResult = 1
    for (const op of fact.operands) {
      const newContext = this.contextExplainer.extendContextWithExplanation(context)
      const operandResult = await this.expressionChecker.checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in PRODUCT', String(operandResult), 'for operand', op)
      if (Array.isArray(operandResult)) {
        for (const arrayOp of operandResult) {
          if (arrayOp) {
            productResult = BigUtil.multiply(arrayOp, productResult)
          }
        }
      } else {
        productResult = BigUtil.multiply(operandResult, productResult)
      }

      if (typeof operandResult === 'undefined') {
        hasUndefined = true
      }
    }
    const finalProductResult = hasUndefined ? undefined : productResult
    this.logger.debug('Resolved PRODUCT as', String(finalProductResult))
    this.contextExplainer.extendContextExplanationWithResult(context, finalProductResult)
    return finalProductResult
  }
}
