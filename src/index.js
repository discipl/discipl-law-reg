
import * as abundance from '@discipl/abundance-service'

const DISCIPL_FLINT_MODEL = 'DISCIPL_FLINT_MODEL'
const DISCIPL_FLINT_FACT = 'DISCIPL_FLINT_FACT'
const DISCIPL_FLINT_ACT = 'DISCIPL_FLINT_ACT'
const DISCIPL_FLINT_DUTY = 'DISCIPL_FLINT_DUTY'
const DISCIPL_FLINT_ACT_TAKEN = 'DISCIPL_FLINT_ACT_TAKEN'
const DISCIPL_FLINT_GLOBAL_CASE = 'DISCIPL_FLINT_GLOBAL_CASE'
const DISCIPL_FLINT_MODEL_LINK = 'DISCIPL_FLINT_MODEL_LINK'



const getAbundanceService = () => {
  return abundance
}

const checkFact = async (fact, ssid, context) => {
  let factLink = context.facts[fact]
  let core = abundance.getCoreAPI()
  if (factLink) {
    const factReference = await core.get(factLink, ssid)
    const functionRef = factReference.data['DISCIPL_FLINT_FACT'].function

    if (functionRef !== '') {
      return checkFact(functionRef)
    }
    return true
  } else {
    if (context.factResolver) {
      return context.factResolver(fact)
    }
  }
}

const arrayToObject = (arr) => {
  var obj = {};
  Object.keys(arr).forEach(element => {
    Object.assign(obj, arr[element]);
  })
  return obj;
}

const checkPreconditions = (actor, preconditions) => {
  console.log('dit is checkPreconditions')
  return true
}

const checkAction = async (modelLink, actLink, ssid, context) => {



  let core = abundance.getCoreAPI()
  let modelReference = await core.get(modelLink, ssid)
  let actReference = await core.get(actLink, ssid)
  let factReference = arrayToObject(modelReference.data['DISCIPL_FLINT_MODEL'].facts)
  let dutyReference = arrayToObject(modelReference.data['DISCIPL_FLINT_MODEL'].duties)



  const actor = actReference.data['DISCIPL_FLINT_ACT'].actor

  const checkedActor = await checkFact(actor, ssid, {...context, 'facts': factReference })

  const checkedPreConditions = checkPreconditions('actor', actReference.data['DISCIPL_FLINT_ACT'].preconditions)

  if (checkedActor && checkedPreConditions) {
    console.log('checkActor en checkPreconditions zijn true')
    return true
  }

  return false
}

/**
 * Publishes the FLINT model (as JSON) in linked verifiable claims (vc's)
 * in the channel of the given ssid. Each act, fact and duty is stored in a separate vc.
 * Returns a list to the claim holding the whole model with links to individual claims
 * Note that references within the model are not translated into links.
 */
const publish = async (ssid, flint_model) => {
  let core = abundance.getCoreAPI()
  let result = { model: flint_model.model, acts: [], facts: [], duties: [] }
  for (let fact of flint_model.facts) {
    let link = await core.claim(ssid, { [DISCIPL_FLINT_FACT]: fact })
    result.facts.push({ [fact.fact]: link })
  }
  for (let act of flint_model.acts) {
    let link = await core.claim(ssid, { [DISCIPL_FLINT_ACT]: act })
    result.acts.push({ [act.act]: link })
  }
  for (let duty of flint_model.duties) {
    let link = await core.claim(ssid, { [DISCIPL_FLINT_DUTY]: duty })
    result.duties.push({ [duty.duty]: link })
  }
  let mdl = await core.claim(ssid, { [DISCIPL_FLINT_MODEL]: result })
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
  // abundancesvc.observe(case, did)
  //   - of all(nested) service channels, observe actions being taken
  //     - of all claims of the case subject with a predicate that could be required(through being mentioned in a fact in a precondition), observe attestations thereof

  // {
  //   match()
  // }
}

/**
 * Denotes a given act in the context of a case as taken, optionally supplying / denoting the object(s)
 * which the action is taken upon or with. The given ssid must be applicable to the actor the action must be taken by
 */
const take = async (ssid, caseLink, act, context) => {
  let core = abundance.getCoreAPI()
  let caseClaim = await core.get(caseLink, ssid)

  let isFirstActionInCase = !Object.keys(caseClaim.data).includes(DISCIPL_FLINT_ACT_TAKEN)
  let firstCaseLink = isFirstActionInCase ? caseLink : caseClaim.data[DISCIPL_FLINT_GLOBAL_CASE]
  let firstCase = await core.get(firstCaseLink, ssid)

  let modelLink = firstCase.data['need'][DISCIPL_FLINT_MODEL_LINK]

  let model = await core.get(modelLink, ssid)

  let actLink = await model.data[DISCIPL_FLINT_MODEL].acts.filter((actWithLink) => {
    return Object.keys(actWithLink).includes(act)
  }).map((actWithLink) => Object.values(actWithLink)[0])[0]

  if (await checkAction(modelLink, actLink, ssid, context)) {
    console.log('Claiming')
    return core.claim(ssid, { [DISCIPL_FLINT_ACT_TAKEN]: actLink, [DISCIPL_FLINT_GLOBAL_CASE]: firstCaseLink })
  }

  throw new Error('Action is not allowed')
}

export {
  getAbundanceService,
  checkAction,
  publish,
  get,
  observe,
  take
}
