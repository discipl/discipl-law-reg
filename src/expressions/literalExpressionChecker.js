import Big from 'big.js'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class LiteralExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let literalValue = fact.operand
    if (typeof literalValue === 'number') {
      literalValue = Big(literalValue)
    }

    this._getContextExplainer().extendContextExplanationWithResult(context, literalValue)
    return literalValue
  }
}
