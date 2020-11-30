import { DISCIPL_ANYONE_MARKER } from '../index'
import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class IsExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    if (!fact.operand) {
      throw new Error('A operand must be given for the IS expression')
    }
    const isAnyone = this._checkForIsAnyone(fact.operand, context)
    if (isAnyone) {
      return true
    }

    return this._checkForDidIdentification(fact.operand, context, ssid)
  }

  /**
   * Checks if fact is anyone marker
   *
   * @param {string} did - The did to check
   * @param {Context} context - Represents the context of the check
   * @returns {boolean} true if did is anyone marker
   */
  _checkForIsAnyone (did, context) {
    if (did === DISCIPL_ANYONE_MARKER) {
      this.logger.debug('Resolved IS as true, because anyone can be this')
      this._getContextExplainer().extendContextExplanationWithResult(context, true)
      return true
    }
    return false
  }

  /**
   * Checks if fact is `IS`-construction and if so returns if it's allowed
   *
   * @param {string} did - The did to check
   * @param {Context} context - Represents the context of the check
   * @param {object} ssid - Identity of the entity performing the check
   * @returns {boolean} true or false if fact is `IS`-construction else undefined
   */
  _checkForDidIdentification (did, context, ssid) {
    if (did != null) {
      const didIsIdentified = ssid.did === did || !context.myself
      this.logger.debug('Resolving fact IS as', didIsIdentified, 'by', context.myself ? 'did-identification' : 'the concerned being someone else')
      this._getContextExplainer().extendContextExplanationWithResult(context, didIsIdentified)
      return didIsIdentified
    }
    return undefined
  }
}
