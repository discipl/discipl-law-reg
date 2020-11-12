import { getDiscplLogger } from '../loggingUtil'
import { BigUtil } from '../big_util'

export class CreateExpressionChecker {
  /**
   * Create a CreateExpressionChecker
   * @param {ExpressionChecker} expressionChecker
   * @param {ContextExplainer} contextExplainer
   * @param {FactChecker} factChecker
   */
  constructor (expressionChecker, contextExplainer, factChecker) {
    this.contextExplainer = contextExplainer
    this.expressionChecker = expressionChecker
    this.factChecker = factChecker
    this.logger = getDiscplLogger()
    this.expression = 'CREATE'
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    let finalCreateResult = await this.factChecker.checkCreatedFact(context.previousFact, ssid, context)

    if (!finalCreateResult || !fact.operands) {
      this.logger.debug('Resolving fact', fact, 'as', finalCreateResult, 'by determining earlier creation')

      this.contextExplainer.extendContextExplanationWithResult(context, finalCreateResult)
      return finalCreateResult
    }

    for (const op of fact.operands) {
      let factExists = await this.factChecker.checkFactProvidedInAct(op, ssid, context)
      if (!factExists) {
        factExists = await this.factChecker.checkFact(op, ssid, context)
      }
      if (!factExists) {
        finalCreateResult = false
        break
      }
    }

    this.logger.debug('Resolving fact', fact, 'as', finalCreateResult, 'by determining earlier creation')
    this.contextExplainer.extendContextExplanationWithResult(context, finalCreateResult)

    return finalCreateResult
  }
}
