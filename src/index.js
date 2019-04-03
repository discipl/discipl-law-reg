
const core = require('discipl-core')

const DISCIPL_FLINT_MODEL = 'DISCIPL_FLINT_MODEL'
const DISCIPL_FLINT_FACT = 'DISCIPL_FLINT_FACT'
const DISCIPL_FLINT_ACT = 'DISCIPL_FLINT_ACT'
const DISCIPL_FLINT_DUTY = 'DISCIPL_FLINT_DUTY'
const DISCIPL_FLINT_ACT_TAKEN = 'DISCIPL_FLINT_ACT_TAKEN'


/**
 * Publishes the FLINT model (as JSON) in linked verifiable claims (vc's)
 * in the channel of the given ssid. Each act, fact and duty is stored in a separate vc.
 * Returns a list to the claim holding the whole model with links to individual claims
 * Note that references within the model are not translated into links.
 */
const publish = async (ssid, flint_model) => {
  let result = { model : flint_model.model, acts : [], facts : [] , duties : []}
  for(fact in flint_model.facts) {
    let link = await core.claim(ssid, DISCIPL_FLINT_FACT, fact)
    result.facts.push({[fact.fact]:link})
  }
  for(act in flint_model.acts) {
    let link = await core.claim(ssid, DISCIPL_FLINT_ACT, act)
    result.acts.push({[act.act]:link})
  }
  for(duty in flint_model.duties) {
    let link = await core.claim(ssid, DISCIPL_FLINT_DUTY, duty)
    result.duties.push({[duty.duty]:link})
  }
  let mdl = core.claim(ssid, DISCIPL_FLINT_MODEL, result)
  return mdl
}

/**
 * Given a published model, retrieves a list of acts the given actor (identified through the given did) can take at this moment or could take
 * once their precondition would be met. For every act in this list, the precondition is evaluated and the result of
 * this and the subresults of the parts in the boolean logic of the precondition are returned. The result thus resembles:
 *
 * {
 *  acts : [
 *    {actlink : {case : '', precondition : true, facts : [{factAlink : true}, {factBlink : true}]}, dutylink : 'enforce', ...},
 *    {actlink : {case : 'discipl:link:ephemeral...', precondition : false, facts : [{factAlink : true}, {factBlink : false}]}, dutylink : 'fulfill', ...}
 *  ]
 * }
 *
 * the acts in the result also optionally contain links to a duty if the act is part of a duty either as enforcement act or act with
 * which to fulfill the duty. Also every act links to a case as context, being the need created out of a starting act or need for a starting act
 * from which a trail of (sub)needs being solved can be found
 */
const get = async (model, did) => {


}

/**
 * Observes changes in process state (new acts that can be taken or termination of such acts for the given did)
 * changes in process state for a given did may occur when acts within the model are taken or facts evaluating
 * differently because of new claims of the interested party of the case (start act) or attestations of such claims
 */
const observe = async (model, did) => {
  abundancesvc.observe(case, did)
  - of all (nested) service channels, observe actions being taken
  - of all claims of the case subject with a predicate that could be required (through being mentioned in a fact in a precondition), observe attestations thereof

  {
    match()
  }
}

/**
 * Denotes a given act in the context of a case as taken, optionally supplying / denoting the object(s)
 * which the action is taken upon or with. The given ssid must be applicable to the actor the action must be taken by
 */
const take = (ssid, case, act, obj = null) => {
  let acts = get(case, ssid.did)
  for(a in acts) {
    if(Object.keys(a)[0] === act) && (a[act].precondition)) {
      let actclaim = core.claim(ssid, case, {[DISCIPL_FLINT_ACT_TAKEN]:act, object:obj, ts:now()})
      abundancesvc.require()
      return actclaim
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
