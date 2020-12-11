import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class CreateExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    const finalCreateResult = await this._getFactChecker().checkCreatableFactCreated(context.previousFact, ssid, context)

    if (!finalCreateResult || !fact.operands) {
      this.logger.debug('Resolving fact', fact, 'as', finalCreateResult, 'by determining earlier creation')

      this._getContextExplainer().extendContextExplanationWithResult(context, finalCreateResult)
      return finalCreateResult
    }

    this.logger.debug('Resolving fact', fact, 'as', finalCreateResult, 'by determining earlier creation')
    this._getContextExplainer().extendContextExplanationWithResult(context, finalCreateResult)

    return finalCreateResult
  }
}
