import { DISCIPL_FLINT_ACT_TAKEN, DISCIPL_FLINT_GLOBAL_CASE, DISCIPL_FLINT_MODEL_LINK } from './index'
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'
import { getDiscplLogger } from './loggingUtil'

export class LinkUtils {
  /**
   * Create an LinkUtils
   * @param {AbundanceService} abundance
   */
  constructor (abundance) {
    this.logger = getDiscplLogger()
    this.abundance = abundance
  }

  // TODO docs
  async getModelLink (firstCaseLink, ssid) {
    const core = this.abundance.getCoreAPI()
    const firstCase = await core.get(firstCaseLink, ssid)

    const modelLink = firstCase.data['need'][DISCIPL_FLINT_MODEL_LINK]
    this.logger.debug('Determined model link to be', modelLink)
    return modelLink
  }

  // TODO docs
  async getFirstCaseLink (caseLink, ssid) {
    const core = this.abundance.getCoreAPI()
    const caseClaim = await core.get(caseLink, ssid)
    const isFirstActionInCase = !Object.keys(caseClaim.data).includes(DISCIPL_FLINT_ACT_TAKEN)
    const firstCaseLink = isFirstActionInCase ? caseLink : caseClaim.data[DISCIPL_FLINT_GLOBAL_CASE]
    this.logger.debug('Determined first case link to be', firstCaseLink)
    return firstCaseLink
  }
}
