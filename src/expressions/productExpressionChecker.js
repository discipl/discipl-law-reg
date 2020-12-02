import { BigUtil } from '../utils/big_util'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class ProductExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let productResult = 1
    for (const op of fact.operands) {
      if (!BigUtil.isNumeric(productResult)) { break }
      const newContext = this._getContextExplainer().extendContextWithExplanation(context)
      const operandResult = await this._getExpressionChecker().checkExpression(op, ssid, newContext)
      this.logger.debug('OperandResult in PRODUCT', String(operandResult), 'for operand', op)
      const opArray = Array.isArray(operandResult) ? operandResult : [operandResult]
      for (const arrayOp of opArray) {
        this.logger.debug('ArrayOperandResult in PRODUCT', String(arrayOp), 'for operand', op)
        if (arrayOp === undefined) {
          productResult = undefined
          break
        } else if (!BigUtil.isNumeric(arrayOp)) {
          productResult = false
          break
        } else {
          productResult = BigUtil.multiply(productResult, arrayOp)
        }
      }
    }
    this.logger.debug('Resolved PRODUCT as', String(productResult))
    this._getContextExplainer().extendContextExplanationWithResult(context, productResult)
    return productResult
  }
}
