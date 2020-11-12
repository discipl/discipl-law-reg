import { getDiscplLogger } from '../loggingUtil'
import Big from 'big.js'

export class LiteralExpressionChecker {
  /**
   * Create a LiteralExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   */
  constructor (expressionChecker, contextExplainer) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.logger = getDiscplLogger()
    this.expression = 'LITERAL'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let literalValue = fact.operand
    if (typeof literalValue === 'number') {
      literalValue = Big(literalValue)
    }

    this.contextExplainer.extendContextExplanationWithResult(context, literalValue)
    return literalValue
  }
}
