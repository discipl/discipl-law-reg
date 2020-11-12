import { AbundanceService } from '@discipl/abundance-service'
import { ModelValidator } from './modelValidator'

import IdentityUtil from './identity_util'
import { getDiscplLogger } from './loggingUtil'
import { arrayToObject } from './arrayUtils'
import { wrapWithDefault } from './defaultFactResolver'
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

const logger = getDiscplLogger()

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
   * Get link utils
   * @return {LinkUtils}
   */
  _getLinkUtils () {
    return this.serviceProvider.linkUtils
  }

  /**
   * Get action checker
   * @return {ActionChecker}
   */
  _getActionChecker () {
    return this.serviceProvider.actionChecker
  }

  /**
   * Get act fetcher
   * @return {ActFetcher}
   */
  _getActFetcher () {
    return this.serviceProvider.actFetcher
  }

  /**
   * Get fact checker
   * @return {FactChecker}
   */
  _getFactChecker () {
    return this.serviceProvider.factChecker
  }

  /**
   * Get expression checker
   * @return {ExpressionChecker}
   */
  _getExpressionChecker () {
    return this.serviceProvider.expressionChecker
  }

  /**
   * Checks a parsed expression by considering the atomic parts and evaluating them
   *
   * @param {ParsedExpression|string} fact - Parsed fact object (might be string if the object is an atomic fact)
   * @param {ssid} ssid - Identity doing the checking
   * @param {Context} context - Context of the check
   * @returns {Promise<boolean>}
   */
  async checkExpression (fact, ssid, context) {
    return this._getExpressionChecker().checkExpression(fact, ssid, context)
  }

  /**
   * Checks a fact link by checking created objects and passing the function to {@link checkFact}
   *
   * @param {string} factLink - Link to the fact
   * @param {string} fact - Name of the fact
   * @param {ssid} ssid - Identity of the entity performing the check
   * @param {Context} context - Represents the context of the check
   * @returns {Promise<boolean>}
   */
  async checkFactLink (factLink, fact, ssid, context) {
    return this._getFactChecker().checkFactLink(factLink, fact, ssid, context)
  }

  /**
   * Checks a fact by doing
   * 1. A lookup in the fact reference
   * 2. Checking if it is an expression, and parsing it
   *   a. If it is a simple expression, pass to the factResolver
   *   b. If it is a complex expression, parse it and evaluate it by parts
   *
   * @param {string|object} fact - fact or expression
   * @param {ssid} ssid - ssid representing the actor
   * @param {Context} context -
   * @returns {Promise<boolean>} - result of the fact
   */
  async checkFact (fact, ssid, context) {
    return this._getFactChecker().checkFact(fact, ssid, context)
  }

  /**
   * Checks a fact by using the factResolver from the context.
   * If an empty fact is to be checked, this is because a reference was followed. in this case we fall back
   * to the previousFact, which likely contains information that can be used to resolve this.
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {ssid} ssid - Identity of entity doing the checking
   * @param {Context} context - context of the checking
   * @returns {Promise<boolean>}
   */
  async checkFactWithResolver (fact, ssid, context) {
    return this._getFactChecker().checkFactWithResolver(fact, ssid, context)
  }

  /**
   * Checks if a fact was created in a act that wasn't terminated yet that the given entity has access to.
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {ssid} ssid - Identity of entity doing the checking
   * @param {Context} context - context of the checking
   * @returns {Promise<boolean>} - true if the fact has been created
   */
  async checkCreatedFact (fact, ssid, context) {
    return this._getFactChecker().checkCreatedFact(fact, ssid, context)
  }

  /**
   * Checks if a given fact was provided in an act that wasn't terminated yet that the given entity has access to.
   *
   * @param {string} fact - Description of the fact, surrounded with []
   * @param {ssid} ssid - Identity of entity doing the checking
   * @param {Context} context - context of the checking
   * @returns {Promise<object>} - the facts value or false if it hasn't been provided
   */
  async checkFactProvidedInAct (fact, ssid, context) {
    return this._getFactChecker().checkFactProvidedInAct(fact, ssid, context)
  }

  /**
   * Returns details of an act, as registered in the model
   *
   * @param {string} actLink - Link to the particular act
   * @param {ssid} ssid - Identity requesting the information
   * @returns {object}
   */
  async getActDetails (actLink, ssid) {
    const core = this.getAbundanceService().getCoreAPI()
    const claimData = await core.get(actLink, ssid)
    return claimData.data[DISCIPL_FLINT_ACT]
  }

  /**
   * Checks if an action is allowed by checking if:
   * 1. The ssid can be the relevant actor
   * 2. The object exists
   * 3. The interested party exists
   * 4. The pre-conditions are fulfilled
   *
   * @param {string} modelLink - Link to a published FLINT model
   * @param {string} actLink - Link to the respective act
   * @param {ssid} ssid - Identity of intended actor
   * @param {Context} context - Context of the action
   * @param {boolean} earlyEscape - If true, will return a result as ssoon as one of the flint items is detrmined to be false
   * @returns {Promise<CheckActionResult>}
   */
  async checkAction (modelLink, actLink, ssid, context, earlyEscape = false) {
    return this._getActionChecker().checkAction(modelLink, actLink, ssid, context, earlyEscape)
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
    const core = this.getAbundanceService().getCoreAPI()
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
        logger.debug('Found earlier act', act)

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

    logger.debug('Active duties', activeDuties, '. Checking ownership now.')
    const ownedDuties = []

    for (const duty of activeDuties) {
      const dutyLink = duties[duty]

      if (dutyLink != null) {
        const dutyInformation = (await core.get(dutyLink, ssid))['data'][DISCIPL_FLINT_DUTY]

        const dutyHolder = dutyInformation['duty-holder']

        if (dutyHolder != null) {
          logger.debug('Checking duty-holder')
          const checkActor = await this.checkFact(dutyHolder, ssid, { 'facts': factReference, 'myself': true, 'caseLink': caseLink })
          if (checkActor) {
            logger.info('Duty', duty, 'is held by', dutyHolder)
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
    logger.debug('Publishing model')
    const core = this.getAbundanceService().getCoreAPI()
    const result = { model: flintModel.model, acts: [], facts: [], duties: [] }
    for (const fact of flintModel.facts) {
      let resultFact = fact
      if (fact.function === '[]' && factFunctions[fact.fact] != null) {
        logger.debug('Setting function for', fact.fact, 'to', factFunctions[fact.fact])

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

    logger.debug('Done publishing')
    return core.claim(ssid, { [DISCIPL_FLINT_MODEL]: result })
  }

  /**
   * Returns all the actions that have been taken in a case so far
   *
   * @param {string} caseLink - Link to the last action in the case
   * @param {ssid} ssid - Identity used to get access to information
   * @returns {Promise<ActionInformation[]>}
   */
  async getActions (caseLink, ssid) {
    const core = this.getAbundanceService().getCoreAPI()
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
   * Denotes a given act in the context of a case as taken, if it is possible. See {@link checkAction} is used to check the conditions
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

    logger.debug('Checking if action', act, 'is possible from perspective of', ssid.did)
    const checkActionInfo = await this.checkAction(modelLink, actLink, ssid, { 'factResolver': defaultFactResolver, 'caseLink': caseLink, 'factsSupplied': factsSupplied }, true)
    if (checkActionInfo.valid) {
      logger.info('Registering act', actLink)
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
   */
  async _addActorIsExpression (actLink, factsSupplied, ssid) {
    const core = this.getAbundanceService().getCoreAPI()
    const actReference = await core.get(actLink, ssid)
    const actor = actReference.data[DISCIPL_FLINT_ACT].actor
    factsSupplied[actor] = IdentityUtil.identityExpression(ssid.did)
    return factsSupplied
  }

  /**
   * Add the result of an action to the explanation part of the context. {@link checkAction} is used to check the conditions.
   *
   * @param {ssid} ssid - Identity of the actor
   * @param {string} caseLink - Link to the case, which is either an earlier action, or a need
   * @param {string} act - description of the act to explain
   * @param {function} factResolver - Function used to resolve facts to fall back on if no other method is available. Defaults to always false
   * @returns {Promise<object>} Explanation object from the context with the action result as value
   */
  async explain (ssid, caseLink, act, factResolver) {
    const { modelLink, actLink } = await this._getModelAndActFromCase(caseLink, ssid, act)

    const defaultFactResolver = wrapWithDefault(factResolver, {})
    const context = { 'factResolver': defaultFactResolver, 'caseLink': caseLink, explanation: {} }
    logger.debug('Checking if action is possible from perspective of', ssid.did)
    const checkActionResult = await this.checkAction(modelLink, actLink, ssid, context, true)
    context.explanation.value = checkActionResult.valid

    return context.explanation
  }

  async _getModelAndActFromCase (caseLink, ssid, act) {
    const core = this.getAbundanceService().getCoreAPI()
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

export {
  LawReg,
  ModelValidator
}
