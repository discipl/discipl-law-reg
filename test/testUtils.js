import { LawReg } from '../src'
import Util from '../src/utils/util'
import { expect } from 'chai'

/**
 * @typedef Step
 * @property {function(lawReg: LawReg, ssids: ssid[], prevLink: string, stepIndex: number, actionLinks: string[], modelLink: string): Promise<string>} execute
 */

/**
 * @param {string} actor - actor name
 * @param {string} act - description of the act to be taken
 * @param {function(*=): function(*): Promise<*|undefined>} factResolverFactory - Function used create a fact resolver
 * @returns {Step}
 */
function takeAction (actor, act, factResolverFactory = simpleFactResolverFactory(false)) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks) {
      try {
        const resolver = factResolverFactory(actionLinks)
        console.log('resolver', resolver)
        const actionLink = await lawReg.take(ssids[actor], link, act, resolver)
        actionLinks.push(actionLink)
        return actionLink
      } catch (e) {
        console.error(`TakeAction${act} Step failed. Step Index ${index}`)
        throw e
      }
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - description of the act to be taken
 * @param {string} message - the failure message
 * @param {function(*=): function(*): Promise<*|undefined>} factResolverFactory - Function used create a fact resolver
 * @returns {Step}
 */
function takeFailingAction (actor, act, message, factResolverFactory = simpleFactResolverFactory(false)) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks) {
      let error
      try {
        const resolver = factResolverFactory(actionLinks)
        return await lawReg.take(ssids[actor], link, act, resolver)
      } catch (e) {
        error = e
      }
      expect(error).to.not.equal(undefined, `TakeFailingAction${act} Step failed to throw error. Step Index ${index}`)
      expect(error.message).to.equal(message, `TakeFailingAction${act} Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string[]} acts - description of the act that is expected
 * @param {function(*=): function(*): Promise<*|undefined>} factResolverFactory - Function used create a fact resolver
 * @returns {Step}
 */
function expectPotentialActs (actor, acts, factResolverFactory = simpleFactResolverFactory(undefined)) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks) {
      const result = (await lawReg.getPotentialActsWithResolver(link, ssids[actor], factResolverFactory(actionLinks))).map((actInfo) => actInfo.act)
      expect(result).to.deep.equal(acts, `ExpectPotentialActs Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - description of the act that is expected
 * @param {function(*=): function(*): Promise<*|undefined>} factResolverFactory - Function used create a fact resolver
 * @returns {Step}
 */
function expectPotentialAct (actor, act, factResolverFactory = simpleFactResolverFactory(undefined)) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks) {
      const result = (await lawReg.getPotentialActsWithResolver(link, ssids[actor], factResolverFactory(actionLinks))).map((actInfo) => actInfo.act)
      expect(result).to.include(act, `ExpectPotentialAct Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string[]} acts - description of the act that is expected
 * @param {function(*=): function(*): Promise<*|undefined>} factResolverFactory - Function used create a fact resolver
 * @returns {Step}
 */
function expectAvailableActs (actor, acts, factResolverFactory = simpleFactResolverFactory(undefined)) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks) {
      const result = (await lawReg.getAvailableActsWithResolver(link, ssids[actor], factResolverFactory(actionLinks))).map((actInfo) => actInfo.act)
      expect(result).to.deep.equal(acts, `ExpectAvailableActs Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - description of the act that is expected
 * @param {function(*=): function(*): Promise<*|undefined>} factResolverFactory - Function used create a fact resolver
 * @returns {Step}
 */
function expectAvailableAct (actor, act, factResolverFactory = simpleFactResolverFactory(undefined)) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks) {
      const result = (await lawReg.getAvailableActsWithResolver(link, ssids[actor], factResolverFactory(actionLinks))).map((actInfo) => actInfo.act)
      expect(result).to.include(act, `ExpectAvailableAct Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string[]} duties - description of the act that is expected
 * @returns {Step}
 */
function expectActiveDuties (actor, duties) {
  return {
    execute: async function (lawReg, ssids, link, index) {
      const result = (await lawReg.getActiveDuties(link, ssids[actor])).map((dutoInfo) => dutoInfo.duty)
      expect(result).to.deep.equal(duties, `ExpectActiveDuties Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - the previous act
 * @param {function(object[], string[]):object} factsSupplied - function that returns the expected supplied acts
 * @return {Step}
 */
function expectData (actor, act, factsSupplied) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks, modelLink) {
      await runOnModel(actor, async (model) => {
        const core = lawReg.getAbundanceService().getCoreAPI()
        const action = await core.get(link, ssids[actor])
        const actLink = Object.values(model.acts.find(anAct => Object.keys(anAct).includes(act)))[0]
        const data = {
          'DISCIPL_FLINT_ACT_TAKEN': actLink,
          'DISCIPL_FLINT_FACTS_SUPPLIED': factsSupplied(ssids, actionLinks),
          'DISCIPL_FLINT_GLOBAL_CASE': actionLinks[0],
          'DISCIPL_FLINT_PREVIOUS_CASE': actionLinks[actionLinks.length - 2]
        }
        expect(action.data).to.deep.equal(data, `ExpectData Step failed. Step Index ${index}`)
      }).execute(lawReg, ssids, link, index, actionLinks, modelLink)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} fact - the fact to check
 * @param {any} aFunction - the expected function for the fact
 * @return {Step}
 */
function expectRetrievedFactFunction (actor, fact, aFunction) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks, modelLink) {
      const core = lawReg.getAbundanceService().getCoreAPI()
      const retrievedModel = await core.get(modelLink)
      const rFacts = retrievedModel.data['DISCIPL_FLINT_MODEL'].facts

      const rFactLink = rFacts.find(aFact => Object.keys(aFact).includes(fact))[fact]
      const rFact = await core.get(rFactLink, ssids[actor])
      expect(rFact.data['DISCIPL_FLINT_FACT'].function).to.deep.equal(aFunction, `ExpectRetrievedFactFunction${fact} Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - the act to check
 * @param {object} checkActionResult - expected result
 * @param {function(*=): function(*): Promise<*|undefined>} factResolverFactory - Function used create a fact resolver
 * @param {boolean} earlyEscape - If true, will return a result as ssoon as one of the flint items is detrmined to be false
 * @return {Step}
 */
function expectCheckActionResult (actor, act, checkActionResult, factResolverFactory, earlyEscape = false) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks, modelLink) {
      const core = lawReg.getAbundanceService().getCoreAPI()
      const retrievedModel = await core.get(modelLink)
      const acts = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      const actLink = Object.values(acts.find(anAct => Object.keys(anAct).includes(act)))[0]
      const result = await lawReg._getActionChecker().checkAction(modelLink, actLink, ssids[actor], { 'factResolver': factResolverFactory(actionLinks) }, earlyEscape)
      expect(result).to.deep.equal(checkActionResult, `ExpectCheckActionResult${act} Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - the act to check
 * @param {object} explainResult - expected result
 * @param {function(*=): function(*): Promise<*|undefined>} factResolverFactory - Function used create a fact resolver
 * @return {Step}
 */
function expectExplainResult (actor, act, explainResult, factResolverFactory) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks) {
      const explanation = await lawReg.explain(ssids['person'], link, '<<explain something>>', factResolverFactory(actionLinks))
      const result = explanation.operandExplanations.filter(explanation => explanation.fact === '[expression]')[0]
      expect(result).to.deep.equal(explainResult, `ExpectExplainResult${act} Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {boolean} acceptAll - if it should return true or false for all
 * @return {function(*=): function(*): Promise<*|undefined>}
 */
function simpleFactResolverFactory (acceptAll) {
  return () => async () => acceptAll
}

/**
 * @param {object} facts
 * @param {Object<string, number[]|number>} cases - Object where the keys are createable facts and the values are the action index to use for that fact
 * @return {function(*=): function(*): Promise<*|undefined>}
 */
function factResolverFactory (facts = {}, cases = {}) {
  return function (actionLinks) {
    return async function (fact) {
      const actionIndex = cases[fact]
      if (typeof actionIndex === 'number') {
        // 0 is global link
        const link = actionLinks[actionIndex + 1]
        console.log('Using action with index', actionIndex + 1, 'with link', link)
        return link
      }
      if (Array.isArray(actionIndex)) {
        // 0 is global link
        const links = actionIndex.map((index) => actionLinks[index + 1])
        console.log('Using actions with indexes', actionIndex, 'with links', links)
        return links
      }
      if (facts[fact] !== undefined) {
        if (Array.isArray(facts[fact])) {
          return facts[fact].shift()
        } else {
          return facts[fact]
        }
      }
      return undefined
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {function(*)} aFunction - the function to run
 * @return {Step}
 */
function runOnModel (actor, aFunction) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks, modelLink) {
      const core = lawReg.getAbundanceService().getCoreAPI()
      const retrievedModel = await core.get(modelLink)
      const rModel = retrievedModel.data['DISCIPL_FLINT_MODEL']
      aFunction(rModel)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} fact - fact to check
 * @param {any} factValue - expected value of fact
 * @return {Step}
 */
function expectModelFact (actor, fact, factValue) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks, modelLink) {
      await runOnModel(actor, async (model) => {
        const core = lawReg.getAbundanceService().getCoreAPI()
        const rFactLink = model.facts.find(aFact => Object.keys(aFact).includes(fact))[fact]
        const rFact = await core.get(rFactLink, ssids[actor])
        expect(rFact.data['DISCIPL_FLINT_FACT']).to.deep.equal(factValue, `ExpectModelFact${fact} Step failed. Step Index ${index}`)
      }).execute(lawReg, ssids, link, index, actionLinks, modelLink)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} duty - duty to check
 * @param {any} dutyValue - expected value of duty
 * @return {Step}
 */
function expectModelDuty (actor, duty, dutyValue) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks, modelLink) {
      await runOnModel(actor, async (model) => {
        const core = lawReg.getAbundanceService().getCoreAPI()
        const rDutyLink = model.duties.find(aDuty => Object.keys(aDuty).includes(duty))[duty]
        const rDuty = await core.get(rDutyLink, ssids[actor])
        expect(rDuty.data['DISCIPL_FLINT_DUTY']).to.deep.equal(dutyValue, `ExpectModelDuty${duty} Step failed. Step Index ${index}`)
      }).execute(lawReg, ssids, link, index, actionLinks, modelLink)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - act to check
 * @param {any} actValue - expected value of act
 * @return {Step}
 */
function expectModelActDetails (actor, act, actValue) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks, modelLink) {
      await runOnModel(actor, async (model) => {
        const rActLink = model.acts.find(anAct => Object.keys(anAct).includes(act))[act]
        const rAct = await lawReg.getActDetails(rActLink, ssids[actor])
        expect(rAct).to.deep.equal(actValue, `ExpectModelActDetails${act} Step failed. Step Index ${index}`)
      }).execute(lawReg, ssids, link, index, actionLinks, modelLink)
      return link
    }
  }
}

/**
 * run scenario
 * @param {object} model FlintModel
 * @param {Object.<string, string[]>} actors Object with keys as actors and values as facts that apply to the actor.
 * @param {Step[]} steps Steps
 * @param {Object.<string, *>} extraFacts
 */
async function runScenario (model, actors, steps, extraFacts = {}) {
  const lawReg = new LawReg()
  const util = new Util(lawReg)
  const core = lawReg.getAbundanceService().getCoreAPI()
  const needSsid = await core.newSsid('ephemeral')
  await core.allow(needSsid)

  const actorNames = Object.keys(actors).filter(name => name !== 'ANYONE')
  const actorVal = _actorFactFunctionSpec(actors)
  _addExtraFacts(actorVal, extraFacts)
  const { ssids, modelLink } = await util.setupModel(model, actorNames, actorVal)
  const globalLink = await core.claim(needSsid, {
    'need': {
      'DISCIPL_FLINT_MODEL_LINK': modelLink
    }
  })

  const actionLinks = [globalLink]

  return steps.reduce(async (previousValue, currentValue, index) => {
    const prevLink = await previousValue
    console.log('------- Executing step:', index + 1)
    const nextLink = await currentValue.execute(lawReg, ssids, prevLink, index + 1, actionLinks, modelLink)
    console.log('------- Executed step:', index + 1)
    return nextLink
  }, globalLink)
}

/**
 * @param {Object<string, string[]>} actors Object with keys as actors and values as facts that apply to the actor.
 * @return {Object<string, string[]>} Object with keys as facts and values as actors that the fact applies to.
 * @private
 */
function _actorFactFunctionSpec (actors) {
  const actorVal = {}
  Object.entries(actors).forEach(entry => entry[1].forEach(fact => {
    let x = actorVal[fact]
    if (!x) {
      x = []
    }
    x.push(entry[0])
    actorVal[fact] = x
  }))
  return actorVal
}

/**
 * @param {Object<string, string[]>} actorVal
 * @param {Object<string, *>} extraFacts
 * @private
 */
function _addExtraFacts (actorVal, extraFacts) {
  Object.keys(extraFacts).forEach(extraFact => { actorVal[extraFact] = extraFacts[extraFact] })
}

export {
  factResolverFactory,
  simpleFactResolverFactory,
  runScenario,
  takeAction,
  takeFailingAction,
  expectPotentialAct,
  expectPotentialActs,
  expectAvailableAct,
  expectAvailableActs,
  expectActiveDuties,
  expectRetrievedFactFunction,
  expectCheckActionResult,
  expectExplainResult,
  expectData,
  expectModelFact,
  expectModelDuty,
  expectModelActDetails,
  runOnModel
}
