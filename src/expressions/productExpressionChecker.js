import { BigUtil } from '../utils/big_util'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class ProductExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let hasUndefined = false
    let productResult = 1
    for (const op of fact.operands) {
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
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
    this._getContextExplainer().extendContextExplanationWithResult(context, finalProductResult)
    return finalProductResult
  }
}
