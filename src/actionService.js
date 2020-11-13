import { wrapWithDefault } from './defaultFactResolver'
import IdentityUtil from './identity_util'
import { DISCIPL_FLINT_ACT, DISCIPL_FLINT_ACT_TAKEN, DISCIPL_FLINT_FACTS_SUPPLIED, DISCIPL_FLINT_GLOBAL_CASE, DISCIPL_FLINT_MODEL, DISCIPL_FLINT_PREVIOUS_CASE } from './index'
import { getDiscplLogger } from './loggingUtil'
// Improve intelisense
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'

export class ActionService {
  /**
   * Create an ActionService
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
   * @return {LinkUtils}
   * @private
   */
  _getLinkUtils () {
    return this.serviceProvider.linkUtils
  }

  /**
   * Get action checker
   * @return {ActionChecker}
   * @private
   */
  _getActionChecker () {
    return this.serviceProvider.actionChecker
  }

  /**
   * Returns all the actions that have been taken in a case so far
   *
   * @param {string} caseLink - Link to the last action in the case
   * @param {ssid} ssid - Identity used to get access to information
   * @returns {Promise<ActionInformation[]>}
   */
  async getActions (caseLink, ssid) {
    const core = this._getAbundanceService().getCoreAPI()
    let actionLink = caseLink

    const acts = []

    while (actionLink != null) {
      const lastAction = await core.get(actionLink, ssid)
      const actLink = lastAction.data[DISCIPL_FLINT_ACT_TAKEN]

      if (actLink != null) {
        const act = await core.get(actLink, ssid)

        if (typeof act.data[DISCIPL_FLINT_ACT].act === 'string') {
          acts.unshift({ 'act': act.data[DISCIPL_FLINT_ACT].act, 'link': actionLink })
        }
      }
      actionLink = lastAction.data[DISCIPL_FLINT_PREVIOUS_CASE]
    }

    return acts
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
    const { core, modelLink, actLink, firstCaseLink } = await this._getModelAndActFromCase(caseLink, ssid, act)

    const factsSupplied = {}

    const defaultFactResolver = wrapWithDefault(factResolver, factsSupplied)

    this.logger.debug('Checking if action', act, 'is possible from perspective of', ssid.did)
    const checkActionInfo = await this._getActionChecker().checkAction(modelLink, actLink, ssid, { 'factResolver': defaultFactResolver, 'caseLink': caseLink, 'factsSupplied': factsSupplied }, true)
    if (checkActionInfo.valid) {
      this.logger.info('Registering act', actLink)
      return core.claim(ssid, {
        [DISCIPL_FLINT_ACT_TAKEN]: actLink,
        [DISCIPL_FLINT_GLOBAL_CASE]: firstCaseLink,
        [DISCIPL_FLINT_PREVIOUS_CASE]: caseLink,
        [DISCIPL_FLINT_FACTS_SUPPLIED]: await this._addActorIsExpression(actLink, factsSupplied, ssid)
      })
    }

    throw new Error('Action ' + act + ' is not allowed due to ' + checkActionInfo.invalidReasons)
  }

  /**
   * Add actor IS expression to supplied facts
   *
   * @param {string} actLink - Link to the particular act
   * @param {ssid} ssid - Identity of the actor
   * @param {object} factsSupplied - The supplied facts
   * @returns {Promise<object>} The supplied facts
   * @private
   */
  async _addActorIsExpression (actLink, factsSupplied, ssid) {
    const core = this._getAbundanceService().getCoreAPI()
    const actReference = await core.get(actLink, ssid)
    const actor = actReference.data[DISCIPL_FLINT_ACT].actor
    factsSupplied[actor] = IdentityUtil.identityExpression(ssid.did)
    return factsSupplied
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
    const { modelLink, actLink } = await this._getModelAndActFromCase(caseLink, ssid, act)

    const defaultFactResolver = wrapWithDefault(factResolver, {})
    const context = { 'factResolver': defaultFactResolver, 'caseLink': caseLink, explanation: {} }
    this.logger.debug('Checking if action is possible from perspective of', ssid.did)
    const checkActionResult = await this._getActionChecker().checkAction(modelLink, actLink, ssid, context, true)
    context.explanation.value = checkActionResult.valid

    return context.explanation
  }

  /**
   * Get model and act from case link, actor ssid and act
   * @param {string} caseLink
   * @param {ssid} ssid
   * @param {string} act
   * @return {Promise<{core: DisciplCore, modelLink: *, actLink: *, firstCaseLink: *}>}
   * @private
   */
  async _getModelAndActFromCase (caseLink, ssid, act) {
    const core = this._getAbundanceService().getCoreAPI()
    const firstCaseLink = await this._getLinkUtils().getFirstCaseLink(caseLink, ssid)
    const modelLink = await this._getLinkUtils().getModelLink(firstCaseLink, ssid)
    const model = await core.get(modelLink, ssid)
    const actLink = await model.data[DISCIPL_FLINT_MODEL].acts.filter((actWithLink) => {
      return Object.keys(actWithLink).includes(act)
    }).map((actWithLink) => Object.values(actWithLink)[0])[0]
    if (actLink == null) {
      throw new Error('Act not found ' + act)
    }
    return { core, modelLink, actLink, firstCaseLink }
  }
}
