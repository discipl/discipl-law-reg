
const core = require('discipl-core')

const DISCIPL_FLINT_MODEL = 'DISCIPL_FLINT_MODEL'
const DISCIPL_FLINT_FACT = 'DISCIPL_FLINT_FACT'
const DISCIPL_FLINT_ACT = 'DISCIPL_FLINT_ACT'
const DISCIPL_FLINT_DUTY = 'DISCIPL_FLINT_DUTY'
const DISCIPL_FLINT_ACT_TAKEN = 'DISCIPL_FLINT_ACT_TAKEN'

/**
 * Publishes the FLINT model (as JSON) in linked verifiable claims (vc's)
 * in the channel of the given ssid. Each act, fact and duty is stored in a separate vc.
 * Returns a list with discipl links to the start acts in the model being the acts
 * that are not referenced in other acts within the model
 */
const publish = async (ssid, flint_model) => {
  let mdl = core.claim(ssid, DISCIPL_FLINT_MODEL, flint_model.model)
  let result = { model : mdl, startacts : []}
  for(fact in flint_model.facts) {
    core.claim(ssid, DISCIPL_FLINT_FACT, fact)
  }
  let acts = []
  for(act in flint_model.acts) {
    acts[act.act] = 1
  }
  for(act in flint_model.acts) {
    for(actref in getActRefs(act.create)) {
      if(acts.actref)
        acts[actref]++
      else
        throw Error('reference to undefined act in create postcondition of act '+actref)
    }
    for(actref in getActRefs(act.terminate)) {
      if(acts.actref)
        acts[actref]++
      else
        throw Error('reference to undefined act in terminate postcondition of act '+actref)
    }
    core.claim(ssid, DISCIPL_FLINT_ACT, act)
  }
  for(duty in flint_model.duties) {
    if(acts[duty.create] && acts[duty.create] && acts[duty.terminate])
      core.claim(ssid, DISCIPL_FLINT_DUTY, duty)
    else
      throw Error('reference to undefined act in duty create, enforce or terminate acts')
  }
  for(act in flint_model.acts) {
    if(acts[act] === 1) {
      result.startacts.push(act)
    }
  }
  return result
}

/**
 * retrieves a list of acts the given actor (identified through the given did) can take at this moment or could take
 * once their precondition would be met. For every act included the precondition is evaluated and the results of
 * the parts in the boolean logic are returned in the result which resembles:
 *
 * {
 *  acts : [
 *    {actlink : {precondition : true, facts : [{factAlink : true}, {factBlink : true}]}, dutylink : 'enforce', ...},
 *    {actlink : {precondition : false, facts : [{factAlink : true}, {factBlink : false}]}, dutylink : 'fulfill', ...}
 *  ]
 * }
 *
 * the acts in the result also optionally contain links to a duty if the act is part of a duty either as enforcement act or act with
 * which to fulfill the duty
 */
const get = async (case, did) => {
  observe(case, did)

}

/**
 * Observes changes in process state (new acts that can be taken or termination of such acts for the given did)
 * changes in process state for a given did may occur when acts within the model are taken or facts evaluating
 * differently.
 */
const observe = async (case, did) => {
  abundancesvc.observe(case, did)
  {
    match()
  }
}

/**
 * Denotes a given act in the context of a case as taken optionally supplying / denoting the object
 * which the action is taken. The given ssid must be applicable to the actor the action must be taken
 */
const take = (ssid, case, act, obj = null) => {
  let acts = get(case, ssid.did)
  for(a in acts) {
    if(Object.keys(a)[0] === act) && (a[act].precondition)) {
      return core.claim(ssid, case, {[DISCIPL_FLINT_ACT_TAKEN]:act, object:obj, ts:now()})
    }
  }
  return null
}

module.exports = {
  publish,
  get,
  observe,
  take
}
