import { AbundanceService } from '@discipl/abundance-service'
import { ModelValidator } from './modelValidator'
import { ServiceProvider } from './serviceProvider'

export const DISCIPL_ANYONE_MARKER = 'ANYONE'
export const DISCIPL_FLINT_FACT = 'DISCIPL_FLINT_FACT'
export const DISCIPL_FLINT_MODEL = 'DISCIPL_FLINT_MODEL'
export const DISCIPL_FLINT_ACT = 'DISCIPL_FLINT_ACT'
export const DISCIPL_FLINT_DUTY = 'DISCIPL_FLINT_DUTY'
export const DISCIPL_FLINT_ACT_TAKEN = 'DISCIPL_FLINT_ACT_TAKEN'
export const DISCIPL_FLINT_FACTS_SUPPLIED = 'DISCIPL_FLINT_FACTS_SUPPLIED'
export const DISCIPL_FLINT_GLOBAL_CASE = 'DISCIPL_FLINT_GLOBAL_CASE'
export const DISCIPL_FLINT_PREVIOUS_CASE = 'DISCIPL_FLINT_PREVIOUS_CASE'
export const DISCIPL_FLINT_MODEL_LINK = 'DISCIPL_FLINT_MODEL_LINK'

class LawReg {
  constructor (abundanceService = new AbundanceService()) {
    this.serviceProvider = new ServiceProvider(abundanceService)
  }

  /**
   * Get abundance service
   * @return {AbundanceService}
   */
  getAbundanceService () {
    return this.serviceProvider.abundanceService
  }

  /**
   * Get action service
   * @return {ActionService}
   * @private
   */
  _getActionService () {
    return this.serviceProvider.actionService
  }

  /**
   * Get action checker
   * @return {ActionChecker}
   * @protected
   */
  _getActionChecker () {
    return this.serviceProvider.actionChecker
  }

  /**
   * Get act fetcher
   * @return {ActFetcher}
   * @private
   */
  _getActFetcher () {
    return this.serviceProvider.actFetcher
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
   * Get duty fetcher
   * @return {DutyFetcher}
   * @private
   */
  _getDutyFetcher () {
    return this.serviceProvider.dutyFetcher
  }

  /**
   * Get model publisher
   * @return {ModelPublisher}
   * @private
   */
  _getModelPublisher () {
    return this.serviceProvider.modelPublisher
  }

  /**
   * Returns details of an act, as registered in the model
   *
   * @param {string} actLink - Link to the particular act
   * @param {ssid} ssid - Identity requesting the information
   * @returns {object}
   */
  async getActDetails (actLink, ssid) {
    return this._getActFetcher().getActDetails(actLink, ssid)
  }

  /**
   * Returns the names of all acts that can be taken, given the current caseLink, ssid of the actor and a list of facts
   *
   * @param {string} caseLink - Link to the case, last action that was taken
   * @param {ssid} ssid - Identifies the actor
   * @param {string[]} facts - Array of true facts
   * @param {string[]} nonFacts - Array of false facts
   * @returns {Promise<Array>}
   */
  async getAvailableActs (caseLink, ssid, facts = [], nonFacts = []) {
    return this._getActFetcher().getAvailableActs(caseLink, ssid, facts, nonFacts)
  }

  /**
   * Returns the names of all acts that can be taken, given the current caseLink, ssid of the actor and a list of facts
   *
   * @param {string} caseLink - Link to the case, last action that was taken
   * @param {ssid} ssid - Identifies the actor
   * @param {function} factResolver - Returns the value of a fact if known, and undefined otherwise
   * @returns {Promise<Array>}
   */
  async getAvailableActsWithResolver (caseLink, ssid, factResolver) {
    return this._getActFetcher().getAvailableActsWithResolver(caseLink, ssid, factResolver)
  }

  /**
   * Returns the names of all acts that could be taken potentially if more facts are supplied,
   * given the current caseLink, ssid of the actor and a list of facts and nonFacts
   *
   * @param {string} caseLink - Link to the case, last action that was taken
   * @param {ssid} ssid - Identifies the actor
   * @param {string[]} facts - Array of true facts
   * @param {string[]} nonFacts - Array of false facts
   * @returns {Promise<Array>}
   */
  async getPotentialActs (caseLink, ssid, facts = [], nonFacts = []) {
    return this._getActFetcher().getPotentialActs(caseLink, ssid, facts, nonFacts)
  }

  /**
   * Returns the names of all acts that could be taken potentially if more facts are supplied,
   * given the current caseLink, ssid of the actor and a factResolver
   *
   * @param {string} caseLink - Link to the case, last action that was taken
   * @param {ssid} ssid - Identifies the actor
   * @param {function} factResolver - Returns the value of a fact if known, and undefined otherwise
   * @returns {Promise<Array>}
   */
  async getPotentialActsWithResolver (caseLink, ssid, factResolver) {
    return this._getActFetcher().getPotentialActsWithResolver(caseLink, ssid, factResolver)
  }

  /**
   * Returns the active duties that apply in the given case for the given ssid
   *
   * @param {string} caseLink - link to the current state of the case
   * @param {ssid} ssid - identity to find duties for
   * @returns {Promise<DutyInformation[]>}
   */
  async getActiveDuties (caseLink, ssid) {
    return this._getDutyFetcher().getActiveDuties(caseLink, ssid)
  }

  /**
   * Publishes the FLINT model (as JSON) in linked verifiable claims (vc's)
   * in the channel of the given ssid. Each act, fact and duty is stored in a separate vc.
   * Returns a list to the claim holding the whole model with links to individual claims
   * Note that references within the model are not translated into links.
   *
   * @param {ssid} ssid SSID that publishes the model
   * @param {object} flintModel Model to publish
   * @param {object} factFunctions Additional factFunction that are declared outside the model
   * @return {Promise<string>} Link to a verifiable claim that holds the published model
   */
  async publish (ssid, flintModel, factFunctions = {}) {
    return this._getModelPublisher().publish(ssid, flintModel, factFunctions)
  }

  /**
   * Returns all the actions that have been taken in a case so far
   *
   * @param {string} caseLink - Link to the last action in the case
   * @param {ssid} ssid - Identity used to get access to information
   * @returns {Promise<ActionInformation[]>}
   */
  async getActions (caseLink, ssid) {
    return this._getActionService().getActions(caseLink, ssid)
  }

  /**
   * Denotes a given act in the context of a case as taken, if it is possible. See {@link ActionChecker.checkAction} is used to check the conditions
   *
   * @param {ssid} ssid - Identity of the actor
   * @param {string} caseLink - Link to the case, which is either an earlier action, or a need
   * @param {string} act - description of the act to be taken
   * @param {function} factResolver - Function used to resolve facts to fall back on if no other method is available. Defaults to always false
   * @returns {Promise<string>} Link to a verifiable claim that holds that taken actions
   */
  async take (ssid, caseLink, act, factResolver = () => false) {
    return this._getActionService().take(ssid, caseLink, act, factResolver)
  }

  /**
   * Add the result of an action to the explanation part of the context. {@link ActionChecker.checkAction} is used to check the conditions.
   *
   * @param {ssid} ssid - Identity of the actor
   * @param {string} caseLink - Link to the case, which is either an earlier action, or a need
   * @param {string} act - description of the act to explain
   * @param {function} factResolver - Function used to resolve facts to fall back on if no other method is available. Defaults to always false
   * @returns {Promise<Explanation>} Explanation object from the context with the action result as value
   */
  async explain (ssid, caseLink, act, factResolver) {
    return this._getActionService().explain(ssid, caseLink, act, factResolver)
  }
}

export {
  LawReg,
  ModelValidator
}
