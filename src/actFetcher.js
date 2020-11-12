import { DISCIPL_FLINT_MODEL } from './index'
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'
import { getDiscplLogger } from './loggingUtil'
import { wrapWithDefault } from './defaultFactResolver'

export class ActFetcher {
  /**
   * Create an ActFetcher
   * @param {ContextExplainer} contextExplainer
   * @param {AbundanceService} abundance
   * @param {ActionChecker} actionChecker
   * @param {LinkUtils} linkUtils
   */
  constructor (contextExplainer, abundance, actionChecker, linkUtils) {
    this.contextExplainer = contextExplainer
    this.logger = getDiscplLogger()
    this.abundance = abundance
    this.actionChecker = actionChecker
    this.linkUtils = linkUtils
  }

  /**
   * Get abundance service
   * @return {AbundanceService}
   */
  _getAbundanceService () {
    return this.abundance
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
    const factResolver = (fact) => {
      if (facts.includes(fact)) {
        return true
      }

      if (nonFacts.includes(fact)) {
        return false
      }
    }

    return this.getAvailableActsWithResolver(caseLink, ssid, factResolver)
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
    const core = this._getAbundanceService().getCoreAPI()

    const firstCaseLink = await this.linkUtils.getFirstCaseLink(caseLink, ssid)
    const modelLink = await this.linkUtils.getModelLink(firstCaseLink, ssid)

    const model = await core.get(modelLink, ssid)

    const acts = await model.data[DISCIPL_FLINT_MODEL].acts

    const defaultFactResolver = wrapWithDefault(factResolver, {})

    const allowedActs = []
    this.logger.debug('Checking', acts, 'for available acts')
    for (const actWithLink of acts) {
      this.logger.debug('Checking whether', actWithLink, 'is an available option')

      const link = Object.values(actWithLink)[0]

      const checkActionInfo = await this.actionChecker.checkAction(modelLink, link, ssid, { 'factResolver': defaultFactResolver, 'caseLink': caseLink })
      if (checkActionInfo.valid) {
        const actionInformation = {
          'act': Object.keys(actWithLink)[0],
          'link': Object.values(actWithLink)[0]
        }
        allowedActs.push(actionInformation)
      }
    }

    return allowedActs
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
    const factResolver = (fact) => {
      if (facts.includes(fact)) {
        return true
      }

      if (nonFacts.includes(fact)) {
        return false
      }
    }

    return this.getPotentialActsWithResolver(caseLink, ssid, factResolver)
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
    const core = this.abundance.getCoreAPI()

    const firstCaseLink = await this.linkUtils.getFirstCaseLink(caseLink, ssid)
    const modelLink = await this.linkUtils.getModelLink(firstCaseLink, ssid)

    const model = await core.get(modelLink, ssid)

    const acts = await model.data[DISCIPL_FLINT_MODEL].acts

    const allowedActs = []
    this.logger.debug('Checking', acts, 'for potentially available acts')
    for (const actWithLink of acts) {
      const unknownItems = []

      const defaultFactResolver = wrapWithDefault(factResolver, {})
      this.logger.debug('Checking whether', actWithLink, 'is a potentially available option')

      const link = Object.values(actWithLink)[0]
      const checkActionInfo = await this.actionChecker.checkAction(modelLink, link, ssid, { 'factResolver': defaultFactResolver, 'caseLink': caseLink })
      this.logger.debug('Unknown items', unknownItems)
      if (typeof checkActionInfo.valid === 'undefined') {
        const actionInformation = {
          'act': Object.keys(actWithLink)[0],
          'link': Object.values(actWithLink)[0]
        }
        allowedActs.push(actionInformation)
      }
    }

    return allowedActs
  }
}
