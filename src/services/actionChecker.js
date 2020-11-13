import { DISCIPL_FLINT_ACT, DISCIPL_FLINT_MODEL } from '../index'
import { getDiscplLogger } from '../utils/logging_util'
// Improve intelisense
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'
import { arrayToObject } from '../utils/array_util'

export class ActionChecker {
  /**
   * Create an ActionChecker
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
   * Get fact checker
   * @return {FactChecker}
   * @private
   */
  _getFactChecker () {
    return this.serviceProvider.factChecker
  }

  /**
   * Get context explainer
   * @return {ContextExplainer}
   * @private
   */
  _getContextExplainer () {
    return this.serviceProvider.contextExplainer
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
   * @param {boolean} earlyEscape - If true, will return a result as soon as one of the flint items is determined to be false
   * @returns {Promise<CheckActionResult>}
   */
  async checkAction (modelLink, actLink, ssid, context, earlyEscape = false) {
    this.logger.debug('Checking action', actLink)
    const core = this._getAbundanceService().getCoreAPI()
    const modelReference = await core.get(modelLink, ssid)
    this.logger.debug('Obtained modelReference', modelReference)
    const actReference = await core.get(actLink, ssid)
    const factReference = arrayToObject(modelReference.data[DISCIPL_FLINT_MODEL].facts)
    this.logger.debug('Fact reference obtained from model', factReference)

    const actor = actReference.data[DISCIPL_FLINT_ACT].actor

    const invalidReasons = []

    const actorContext = this._getContextExplainer().extendContextWithExplanation(context)

    this.logger.info('Checking if', actor, 'is', ssid.did)
    const checkedActor = await this._getFactChecker().checkFact(actor, ssid, { ...actorContext, 'facts': factReference, 'myself': true })

    if (!checkedActor) {
      invalidReasons.push('actor')
      if (earlyEscape) {
        return {
          'valid': false,
          'invalidReasons': invalidReasons
        }
      }
    }

    const object = actReference.data[DISCIPL_FLINT_ACT].object

    this.logger.debug('Original object', object)

    const objectContext = this._getContextExplainer().extendContextWithExplanation(context)
    const checkedObject = await this._getFactChecker().checkFact(object, ssid, { ...objectContext, 'facts': factReference })

    if (!checkedObject) {
      invalidReasons.push('object')
      if (earlyEscape) {
        return {
          'valid': false,
          'invalidReasons': invalidReasons
        }
      }
    }

    const recipient = actReference.data[DISCIPL_FLINT_ACT].recipient
    this.logger.debug('Original recipient', recipient)
    const interestedPartyContext = this._getContextExplainer().extendContextWithExplanation(context)
    const checkedInterestedParty = await this._getFactChecker().checkFact(recipient, ssid, { ...interestedPartyContext, 'facts': factReference })

    if (!checkedInterestedParty) {
      invalidReasons.push('recipient')
      if (earlyEscape) {
        return {
          'valid': false,
          'invalidReasons': invalidReasons
        }
      }
    }

    const preconditions = actReference.data['DISCIPL_FLINT_ACT'].preconditions

    this.logger.debug('Original preconditions', preconditions)
    // Empty string, null, undefined are all explictly interpreted as no preconditions, hence the action can proceed
    const preconditionContext = this._getContextExplainer().extendContextWithExplanation(context)
    const checkedPreConditions = preconditions !== '[]' && preconditions != null && preconditions !== '' ? await this._getFactChecker().checkFact(preconditions, ssid,
      { ...preconditionContext, 'facts': factReference })
      : true

    if (!checkedPreConditions) {
      invalidReasons.push('preconditions')
      if (earlyEscape) {
        return {
          'valid': false,
          'invalidReasons': invalidReasons
        }
      }
    }

    if (checkedActor && checkedPreConditions && checkedObject && checkedInterestedParty) {
      this.logger.info('Prerequisites for act', actLink, 'have been verified')
      return {
        'valid': true,
        'invalidReasons': []
      }
    }

    const definitivelyNotPossible = checkedActor === false || checkedObject === false || checkedInterestedParty === false || checkedPreConditions === false

    const validity = definitivelyNotPossible ? false : undefined

    this.logger.info('Pre-act check failed due to', invalidReasons, definitivelyNotPossible ? 'It is impossible.' : 'It might work with more information')
    return {
      'valid': validity,
      'invalidReasons': invalidReasons
    }
  }
}
