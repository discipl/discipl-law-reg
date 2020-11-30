import { getDiscplLogger } from '../utils/logging_util'
import Big from 'big.js'

export class LiteralExpressionChecker {
  /**
   * Create a LiteralExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
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
    let literalValue = fact.operand
    if (typeof literalValue === 'number') {
      literalValue = Big(literalValue)
    }

    this._getContextExplainer().extendContextExplanationWithResult(context, literalValue)
    return literalValue
  }
}
