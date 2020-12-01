import { DISCIPL_FLINT_ACT, DISCIPL_FLINT_ACT_TAKEN, DISCIPL_FLINT_DUTY, DISCIPL_FLINT_MODEL, DISCIPL_FLINT_PREVIOUS_CASE } from '../index'
import { getDiscplLogger } from '../utils/logging_util'
// Improve intelisense
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'
import { arrayToObject } from '../utils/array_util'

export class DutyFetcher {
  /**
   * Create a DutyFetcher
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.logger = getDiscplLogger()
    this.serviceProvider = serviceProvider
  }

  /**
   * Get abundance service
   * @return {AbundanceService}
   * @private
   */
  _getAbundanceService () {
    return this.serviceProvider.abundanceService
  }

  /**
   * Get link utils
   * @return {LinkUtil}
   * @private
   */
  _getLinkUtils () {
    return this.serviceProvider.linkUtil
  }

  /**
   * Get fact checker
   * @return {FactChecker}
   * @private
   */
  _getFactChecker () {
    return this.serviceProvider.factChecker
  }

  /**
   * Returns the active duties that apply in the given case for the given ssid
   *
   * @param {string} caseLink - link to the current state of the case
   * @param {ssid} ssid - identity to find duties for
   * @returns {Promise<DutyInformation[]>}
   */
  async getActiveDuties (caseLink, ssid) {
    const core = this._getAbundanceService().getCoreAPI()
    const firstCaseLink = await this._getLinkUtils().getFirstCaseLink(caseLink, ssid)
    const modelLink = await this._getLinkUtils().getModelLink(firstCaseLink, ssid)

    const model = await core.get(modelLink, ssid)

    const duties = arrayToObject(model.data[DISCIPL_FLINT_MODEL].duties)

    const factReference = arrayToObject(model.data[DISCIPL_FLINT_MODEL].facts)

    let actionLink = caseLink

    const terminatedDuties = []
    const activeDuties = []

    while (actionLink != null) {
      const lastAction = await core.get(actionLink, ssid)

      const actLink = lastAction.data[DISCIPL_FLINT_ACT_TAKEN]

      if (actLink != null) {
        const act = await core.get(actLink, ssid)
        this.logger.debug('Found earlier act', act)

        if (typeof act.data[DISCIPL_FLINT_ACT].create === 'string') {
          const matches = act.data[DISCIPL_FLINT_ACT].create.match(/<[^>]+>/g) || []
          // If the duty is terminated, we should not include it as active
          activeDuties.push(...matches.filter(duty => !terminatedDuties.includes(duty)))
        }

        if (typeof act.data[DISCIPL_FLINT_ACT].terminate === 'string') {
          const matches = act.data[DISCIPL_FLINT_ACT].terminate.match(/<[^>]+>/g) || []
          terminatedDuties.push(...matches)
        }
      }
      actionLink = lastAction.data[DISCIPL_FLINT_PREVIOUS_CASE]
    }

    this.logger.debug('Active duties', activeDuties, '. Checking ownership now.')
    const ownedDuties = []

    for (const duty of activeDuties) {
      const dutyLink = duties[duty]

      if (dutyLink != null) {
        const dutyInformation = (await core.get(dutyLink, ssid))['data'][DISCIPL_FLINT_DUTY]

        const dutyHolder = dutyInformation['duty-holder']

        if (dutyHolder != null) {
          this.logger.debug('Checking duty-holder')
          const checkActor = await this._getFactChecker().checkFact(dutyHolder, ssid, { 'facts': factReference, 'myself': true, 'caseLink': caseLink })
          if (checkActor) {
            this.logger.info('Duty', duty, 'is held by', dutyHolder)
            ownedDuties.push({
              'duty': duty,
              'link': dutyLink
            })
          }
        }
      }
    }

    return ownedDuties
  }
}
