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
 * @param {function} factResolver - Function used to resolve facts to fall back on if no other method is available. Defaults to always false
 * @returns {Step}
 * @constructor
 */
function TakeAction (actor, act, factResolver = () => false) {
  return {
    execute: async function (lawReg, ssids, link, index) {
      try {
        return await lawReg.take(ssids[actor], link, act, factResolver)
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
function TakeFailingAction (actor, act, message, factResolver = () => false) {
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
function ExpectPotentialActs (actor, acts, factResolver = FactResolverOf({})) {
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
function ExpectPotentialAct (actor, act, factResolver = FactResolverOf({})) {
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
function ExpectAvailableActs (actor, acts, factResolver = FactResolverOf({})) {
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
function ExpectAvailableAct (actor, act, factResolver = FactResolverOf({})) {
  return {
    execute: async function (lawReg, ssids, link, index) {
      const result = (await lawReg.getAvailableActsWithResolver(link, ssids[actor], factResolver)).map((actInfo) => actInfo.act)
      expect(result).to.include(act, `ExpectAvailableAct Step failed. Step Index ${index}`)
      return link
    }
  }
}

/**
 * @param {object} facts
 * @return {function(string): boolean}
 */
function FactResolverOf (facts) {
  return (fact) => facts[fact]
}

/**
 * run scenario
 * @param {object} model FlintModel
 * @param {Object.<string, string[]>} actors Object with keys as facts and values as actors the fact applies to.
 * @param {Step[]} steps Steps
 */
async function runScenario (model, actors, steps) {
  const lawReg = new LawReg()
  const util = new Util(lawReg)
  const core = lawReg.getAbundanceService().getCoreAPI()
  const needSsid = await core.newSsid('ephemeral')
  await core.allow(needSsid)

  const actorNames = Object.values(actors).flatMap(value => value).filter(_onlyUnique)
  const { ssids, modelLink } = await util.setupModel(model, actorNames, actors)
  const link = await core.claim(needSsid, {
    'need': {
      'DISCIPL_FLINT_MODEL_LINK': modelLink
    }
  })

  return steps.reduce(async (previousValue, currentValue, index) => {
    const value = await previousValue
    console.log('------- Executing step:', index + 1)
    return currentValue.execute(lawReg, ssids, value, index + 1)
  }, link)
}

function _onlyUnique (value, index, self) {
  return self.indexOf(value) === index
}

export {
  FactResolverOf,
  runScenario,
  TakeAction,
  TakeFailingAction,
  ExpectPotentialAct,
  ExpectPotentialActs,
  ExpectAvailableAct,
  ExpectAvailableActs
}
