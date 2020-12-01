import { getDiscplLogger } from '../utils/logging_util'
import { DISCIPL_FLINT_ACT, DISCIPL_FLINT_DUTY, DISCIPL_FLINT_FACT, DISCIPL_FLINT_MODEL } from '../index'
// Improve intelisense
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'

export class ModelPublisher {
  /**
   * Create a ModelPublisher
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
    this.logger.debug('Publishing model')
    const core = this._getAbundanceService().getCoreAPI()
    const result = { model: flintModel.model, acts: [], facts: [], duties: [] }
    for (const fact of flintModel.facts) {
      let resultFact = fact
      if (fact.function === '[]' && factFunctions[fact.fact] != null) {
        this.logger.debug('Setting function for', fact.fact, 'to', factFunctions[fact.fact])

        resultFact = { ...fact, 'function': factFunctions[fact.fact] }
      }
      const link = await core.claim(ssid, { [DISCIPL_FLINT_FACT]: resultFact })
      result.facts.push({ [fact.fact]: link })
    }

    for (const act of flintModel.acts) {
      const link = await core.claim(ssid, { [DISCIPL_FLINT_ACT]: act })
      result.acts.push({ [act.act]: link })
    }
    for (const duty of flintModel.duties) {
      const link = await core.claim(ssid, { [DISCIPL_FLINT_DUTY]: duty })
      result.duties.push({ [duty.duty]: link })
    }

    this.logger.debug('Done publishing')
    return core.claim(ssid, { [DISCIPL_FLINT_MODEL]: result })
  }
}
