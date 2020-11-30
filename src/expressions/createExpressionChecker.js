import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class CreateExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    let finalCreateResult = await this._getFactChecker().checkCreatedFact(context.previousFact, ssid, context)

    if (!finalCreateResult || !fact.operands) {
      this.logger.debug('Resolving fact', fact, 'as', finalCreateResult, 'by determining earlier creation')

      this._getContextExplainer().extendContextExplanationWithResult(context, finalCreateResult)
      return finalCreateResult
    }

    for (const op of fact.operands) {
      let factExists = await this._getFactChecker().checkFactProvidedInAct(op, ssid, context)
      if (!factExists) {
        factExists = await this._getFactChecker().checkFact(op, ssid, context)
      }
      if (!factExists) {
        finalCreateResult = false
        break
      }
    }

    this.logger.debug('Resolving fact', fact, 'as', finalCreateResult, 'by determining earlier creation')
    this._getContextExplainer().extendContextExplanationWithResult(context, finalCreateResult)

    return finalCreateResult
  }
}
