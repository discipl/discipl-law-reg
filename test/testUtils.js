import { LawReg } from '../src'
import Util from '../src/util'
import { expect } from 'chai'

/**
 * @typedef Step
 * @property {Function} execute
 */

/**
 * @param {string} actor - actor name
 * @param {string} act - description of the act to be taken
 * @param {function(string) : *} factResolver - Function used to resolve facts to fall back on if no other method is available. Defaults to always false
 * @returns {Step}
 * @constructor
 */
function takeAction (actor, act, factResolver = () => false) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks) {
      try {
        const actionLink = await lawReg.take(ssids[actor], link, act, factResolver)
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
 * @param {function} factResolver - Function used to resolve facts to fall back on if no other method is available. Defaults to always false
 * @returns {Step}
 * @constructor
 */
function takeFailingAction (actor, act, message, factResolver = () => false) {
  return {
    execute: async function (lawReg, ssids, link, index) {
      try {
        return await lawReg.take(ssids[actor], link, act, factResolver)
      } catch (e) {
        expect(e.message).to.equal(message, `TakeFailingAction${act} Step failed. Step Index ${index}`)
        return link
      }
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string[]} acts - description of the act that is expected
 * @param {function} factResolver - Returns the value of a fact if known, and undefined otherwise
 * @returns {Step}
 * @constructor
 */
function expectPotentialActs (actor, acts, factResolver = factResolverOf({})) {
  return {
    execute: async function (lawReg, ssids, link, index) {
      const result = (await lawReg.getPotentialActsWithResolver(link, ssids[actor], factResolver)).map((actInfo) => actInfo.act)
      expect(result).to.deep.equal(acts, `ExpectPotentialActs Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - description of the act that is expected
 * @param {function} factResolver - Returns the value of a fact if known, and undefined otherwise
 * @returns {Step}
 * @constructor
 */
function expectPotentialAct (actor, act, factResolver = factResolverOf({})) {
  return {
    execute: async function (lawReg, ssids, link, index) {
      const result = (await lawReg.getPotentialActsWithResolver(link, ssids[actor], factResolver)).map((actInfo) => actInfo.act)
      expect(result).to.include(act, `ExpectPotentialAct Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string[]} acts - description of the act that is expected
 * @param {function} factResolver - Returns the value of a fact if known, and undefined otherwise
 * @returns {Step}
 * @constructor
 */
function expectAvailableActs (actor, acts, factResolver = factResolverOf({})) {
  return {
    execute: async function (lawReg, ssids, link, index) {
      const result = (await lawReg.getAvailableActsWithResolver(link, ssids[actor], factResolver)).map((actInfo) => actInfo.act)
      expect(result).to.deep.equal(acts, `ExpectAvailableActs Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {string} actor - actor name
 * @param {string} act - description of the act that is expected
 * @param {function} factResolver - Returns the value of a fact if known, and undefined otherwise
 * @returns {Step}
 * @constructor
 */
function expectAvailableAct (actor, act, factResolver = factResolverOf({})) {
  return {
    execute: async function (lawReg, ssids, link, index) {
      const result = (await lawReg.getAvailableActsWithResolver(link, ssids[actor], factResolver)).map((actInfo) => actInfo.act)
      expect(result).to.include(act, `ExpectAvailableAct Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @typedef ActionData
 * @property {string} DISCIPL_FLINT_ACT_TAKEN
 * @property {object} DISCIPL_FLINT_FACTS_SUPPLIED
 * @property {string} DISCIPL_FLINT_GLOBAL_CASE
 * @property {string} DISCIPL_FLINT_PREVIOUS_CASE
 */

/**
 * @param {string} actor
 * @param {string} actName
 * @param {(function(object[],string, string, string):ActionData)} data
 * @return {Step}
 */
function expectData (actor, actName, data) {
  return {
    execute: async function (lawReg, ssids, link, index, actionLinks, modelLink) {
      const core = lawReg.getAbundanceService().getCoreAPI()
      const action = await core.get(link, ssids[actor])
      const retrievedModel = await core.get(modelLink)
      const acts = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      const actLink = Object.values(acts.find(act => Object.keys(act).includes(actName)))[0]
      expect(action.data).to.deep.equal(data(ssids, actionLinks[actionLinks.length - 2], actionLinks[0], actLink), `ExpectData Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {object} facts
 * @return {function(string): boolean}
 */
function factResolverOf (facts) {
  return (fact) => facts[fact]
}

/**
 * run scenario
 * @param {object} model FlintModel
 * @param {Object.<string, string[]>} actors Object with keys as actors and values as facts that apply to the actor.
 * @param {Step[]} steps Steps
 */
async function runScenario (model, actors, steps) {
  const lawReg = new LawReg()
  const util = new Util(lawReg)
  const core = lawReg.getAbundanceService().getCoreAPI()
  const needSsid = await core.newSsid('ephemeral')
  await core.allow(needSsid)

  const actorNames = Object.keys(actors)
  const actorVal = {}
  Object.entries(actors).forEach(entry => entry[1].forEach(fact => {
    let x = actorVal[fact]
    if (!x) {
      x = []
    }
    x.push(entry[0])
    actorVal[fact] = x
  }))
  const { ssids, modelLink } = await util.setupModel(model, actorNames, actorVal)
  const globalLink = await core.claim(needSsid, {
    'need': {
      'DISCIPL_FLINT_MODEL_LINK': modelLink
    }
  })

  const actionLinks = [globalLink]

  return steps.reduce(async (previousValue, currentValue, index) => {
    const value = await previousValue
    console.log('------- Executing step:', index + 1)
    return currentValue.execute(lawReg, ssids, value, index + 1, actionLinks, modelLink)
  }, globalLink)
}

export {
  factResolverOf,
  runScenario,
  takeAction,
  takeFailingAction,
  expectPotentialAct,
  expectPotentialActs,
  expectAvailableAct,
  expectAvailableActs,
  expectData
}
