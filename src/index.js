
import * as abundance from '@discipl/abundance-service'

import * as log from 'loglevel'
import * as peg from 'pegjs'

const DISCIPL_FLINT_MODEL = 'DISCIPL_FLINT_MODEL'
const DISCIPL_FLINT_FACT = 'DISCIPL_FLINT_FACT'
const DISCIPL_FLINT_ACT = 'DISCIPL_FLINT_ACT'
const DISCIPL_FLINT_DUTY = 'DISCIPL_FLINT_DUTY'
const DISCIPL_FLINT_ACT_TAKEN = 'DISCIPL_FLINT_ACT_TAKEN'
const DISCIPL_FLINT_GLOBAL_CASE = 'DISCIPL_FLINT_GLOBAL_CASE'
const DISCIPL_FLINT_PREVIOUS_CASE = 'DISCIPL_FLINT_PREVIOUS_CASE'
const DISCIPL_FLINT_MODEL_LINK = 'DISCIPL_FLINT_MODEL_LINK'

const logger = log.getLogger('disciplLawReg')

const getAbundanceService = () => {
  return abundance
}

// const factFunctionParser = peg.generate(`
// // Flint Fact Function Grammar
// // ==========================
// //
// // Accepts expressions like "fact1 AND (fact2 OR fact3)" and evaluates it

// Expression
//   = head:Term tail:(_ ("AND" / "OR") _ Term)* {
//     console.log('head :: ', head)
//     console.log('tail :: ',tail)
//       return tail.reduce(function(result, element) {
//         console.log('result :: ', result)
//         console.log('element :: ',element)
//         if (element[1] === "AND") { return result && element[3]; }
//         if (element[1] === "OR") { return result || element[3]; }
//       }, head);
//     }

// Term
//   = "(" _ expr:Expression _ ")" { console.log('expr :: ', expr); return expr; }
//   / Fact

// Fact "fact"
//   = ![01] { console.log('text() :: ', text());return text() == "1"; }

// _ "whitespace"
//   = [\\r\\n\\t ]*
// `)

const factParser = peg.generate(`
start
  = Expression
  / DelimitedExpression

Expression
  = EN
  / OF
  / NIET
  / Fact
  
DelimitedExpression
  = _ '(' _ ex:Expression _ ')' _ {
   return ex
  }
  / Fact

Fact
  = '[' quote: NotFactBracket* ']' {
  return '[' + quote.join("") + ']'
  }

EN
  = op1: DelimitedExpression op2: (_ 'EN' _ DelimitedExpression)+ {
  let operands = [op1]
  for (let op of op2) {
    operands.push(op[3])
  }
  return {
    'expression': 'AND',
      'operands': operands
  }
}
  
OF
  = op1: DelimitedExpression op2: (_ 'OF' _ DelimitedExpression)+ {
  let operands = [op1]
  for (let op of op2) {
    operands.push(op[3])
  }
  return {
    'expression': 'OR',
      'operands': operands
  }
}
  
NIET
  =  'NIET' _ op: DelimitedExpression {
  return {
    'expression': 'NOT',
    'operand': op
  }
  }
  
NotFactBracket
  = !'[' !']' char: . {
  return char
}
  
  
Text
  = text: NotFactBracket+ {
  return text.join('')
}
  
_ "whitespace"
 = [\\r\\n\\t ]*
`
)

/**
 * evaluates a fact function
 */
const evaluateFactFunction = (factfn) => {
  return factParser.parse(factfn)
}

const checkExpression = async (fact, ssid, context) => {
  let expr = fact.expression
  switch (expr) {
    case 'OR':
      logger.debug('Switch case: OR')
      for (let op of fact.operands) {
        let operandResult = await checkExpression(op, ssid, context)
        if (operandResult === true) {
          logger.debug('Resolved OR as true, because', op, 'is true')
          return true
        }
      }
      logger.debug('Resolved OR as false')
      return false
    case 'AND':
      logger.debug('Switch case: AND')
      for (let op of fact.operands) {
        let operandResult = await checkExpression(op, ssid, context)
        logger.debug('OperandResult in AND', operandResult, 'for operand', op)
        if (operandResult === false) {
          logger.debug('Resolved AND as false, because', op, 'is false')
          return false
        }
      }
      logger.debug('Resolved AND as true')
      return true
    case 'NOT':
      logger.debug('Switch case: NOT')
      return !await checkExpression(fact.operand, ssid, context)

    default:
      logger.debug('Switch case: default')
      if (fact) {
        return checkFactWithResolver(fact, ssid, context)
      }

      throw new Error('Undefined fact')
  }
}

/**
 * Splits a given string from the first ':' to extract the did from the total.
 *
 * @param {string} functionRef - Total string what you want to split
 * @returns {array} array with two items, first is for what it is for and the second is the DID
 */
const splitFunction = (functionRef) => {
  let position = functionRef.indexOf(':')
  let arr = functionRef.split(':', 2)
  arr.push(functionRef.substring(position + 1))
  return arr
}

async function checkFactLink (factLink, fact, ssid, context) {
  const core = abundance.getCoreAPI()
  const factReference = await core.get(factLink, ssid)
  const functionRef = factReference.data[DISCIPL_FLINT_FACT].function

  if (functionRef === '<<>>') {
    let result = await checkCreatedFact(fact, ssid, context)
    logger.debug('Resolving fact', fact, 'as', result, 'by determining earlier creation')
    return result
  }

  if (functionRef !== '' && functionRef !== '[]') {
    logger.debug('Using functionRef', functionRef, 'to resolve fact')
    let splitted = splitFunction(functionRef)
    logger.debug('Splitted functionRef', functionRef)
    logger.debug('Ssid for comparison', ssid)

    if (ssid.did === splitted[2] || !context.myself) {
      logger.debug('Resolving fact', fact, 'as true by', context.myself ? 'did-identification' : 'the concerned being someone else')
      return true
    } else {
      logger.debug('FunctionRef', functionRef, 'cannot be resolved by identification')
      let result = await checkExpression(evaluateFactFunction(functionRef), ssid, context)
      logger.debug('Resolving fact', fact, 'as', result, 'by recursion')
      return result
    }
  } else {
    throw new Error('Not a useful functionRef')
  }
}

/**
 * Checks if the fact did is equal to the did of the ssid. So you can know that someone is allowed to do an action.
 *
 * @param {string} fact - fact name
 * @param {object} ssid - ssid from who wants to make a claim
 * @param {object} context - context is an object for the status of an act and the factreference
 * @returns {Promise<*>} boolean of the result for comparing the did's
 */
const checkFact = async (fact, ssid, context) => {
  logger.debug('Checking fact', fact)
  if (fact === '') {
    logger.debug('Resolving empty fact as true')
    return true
  }

  const factLink = context.facts[fact]

  logger.debug('FactLink', factLink, 'used to resolve fact')
  if (factLink) {
    try {
      return await checkFactLink(factLink, fact, ssid, context)
    } catch (e) {
      const result = context.factResolver(fact)
      logger.debug('Resolving fact', fact, 'as', result, 'by factresolver after link failed')
      return result === true
    }
  } else {
    return checkExpression(evaluateFactFunction(fact), ssid, context)
  }
}

const checkFactWithResolver = async (fact, ssid, context) => {
  const factLink = context.facts ? context.facts[fact] : null

  if (factLink) {
    logger.debug('Deferring to factLink', fact)
    try {
      return await checkFactLink(factLink, fact, ssid, context)
    } catch (e) {
      const result = context.factResolver(fact)
      logger.debug('Resolving fact', fact, 'as', result, 'by factresolver after link failed')
      return result === true
    }
  }

  if (context.factResolver) {
    const result = context.factResolver(fact)
    logger.debug('Resolving fact', fact, 'as', result, 'by factresolver')
    return result === true
  }
  return false
}

const checkCreatedFact = async (fact, ssid, context) => {
  const core = abundance.getCoreAPI()
  let actionLink = context.caseLink

  while (actionLink != null) {
    let lastAction = await core.get(actionLink, ssid)

    let actLink = lastAction.data[DISCIPL_FLINT_ACT_TAKEN]

    if (actLink != null) {
      let act = await core.get(actLink, ssid)

      if (typeof act.data[DISCIPL_FLINT_ACT].create === 'string' && act.data[DISCIPL_FLINT_ACT].create.includes(fact)) {
        return true
      }
    }
    actionLink = lastAction.data[DISCIPL_FLINT_PREVIOUS_CASE]
  }

  return false
}

/**
 * Converts an array into an object
 *
 * @param {array} arr - array with objects in it
 * @returns {object} object instead of the given array
 */
const arrayToObject = (arr) => {
  var obj = {}
  Object.keys(arr).forEach(element => {
    Object.assign(obj, arr[element])
  })
  return obj
}

const checkAction = async (modelLink, actLink, ssid, context) => {
  logger.debug('Checking action', actLink)
  let core = abundance.getCoreAPI()
  let modelReference = await core.get(modelLink, ssid)
  logger.debug('Obtained modelReference', modelReference)
  let actReference = await core.get(actLink, ssid)
  let factReference = arrayToObject(modelReference.data[DISCIPL_FLINT_MODEL].facts)
  logger.debug('Fact reference obtained from model', factReference)

  const actor = actReference.data[DISCIPL_FLINT_ACT].actor

  const checkedActor = await checkFact(actor, ssid, { ...context, 'facts': factReference, 'myself': true })

  const object = actReference.data[DISCIPL_FLINT_ACT].object

  const checkedObject = await checkFact(object, ssid, { ...context, 'facts': factReference })

  const interestedParty = actReference.data[DISCIPL_FLINT_ACT]['interested-party']

  const checkedInterestedParty = await checkFact(interestedParty, ssid, { ...context, 'facts': factReference })

  const checkedPreConditions = await checkFact(actReference.data['DISCIPL_FLINT_ACT'].preconditions, ssid, { ...context, 'facts': factReference })

  if (checkedActor && checkedPreConditions && checkedObject && checkedInterestedParty) {
    logger.info('Preconditions for act', actLink, 'have been verified')
    return true
  }

  let failureMode = ''

  if (!checkedActor) {
    failureMode += ' actor'
  }

  if (!checkedPreConditions) {
    failureMode += ' preconditions'
  }

  if (!checkedObject) {
    failureMode += ' object'
  }

  if (!checkedInterestedParty) {
    failureMode += ' interestedParty'
  }

  logger.info('Preconditions failed for', failureMode)
  return false
}

/**
 * Publishes the FLINT model (as JSON) in linked verifiable claims (vc's)
 * in the channel of the given ssid. Each act, fact and duty is stored in a separate vc.
 * Returns a list to the claim holding the whole model with links to individual claims
 * Note that references within the model are not translated into links.
 */
const publish = async (ssid, flintModel, factFunctions = {}) => {
  logger.debug('Publishing model')
  let core = abundance.getCoreAPI()
  let result = { model: flintModel.model, acts: [], facts: [], duties: [] }
  for (let fact of flintModel.facts) {
    let resultFact = fact
    if (fact.function === '[]' && factFunctions[fact.fact] != null) {
      logger.debug('Setting function for', fact.fact, 'to', factFunctions[fact.fact])

      resultFact = { ...fact, 'function': factFunctions[fact.fact] }
    }
    let link = await core.claim(ssid, { [DISCIPL_FLINT_FACT]: resultFact })
    result.facts.push({ [fact.fact]: link })
  }

  for (let act of flintModel.acts) {
    let link = await core.claim(ssid, { [DISCIPL_FLINT_ACT]: act })
    result.acts.push({ [act.act]: link })
  }
  for (let duty of flintModel.duties) {
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

  logger.debug('Obtained caseClaim', caseClaim)

  let isFirstActionInCase = !Object.keys(caseClaim.data).includes(DISCIPL_FLINT_ACT_TAKEN)
  let firstCaseLink = isFirstActionInCase ? caseLink : caseClaim.data[DISCIPL_FLINT_GLOBAL_CASE]
  let firstCase = await core.get(firstCaseLink, ssid)

  let modelLink = firstCase.data['need'][DISCIPL_FLINT_MODEL_LINK]

  let model = await core.get(modelLink, ssid)

  let actLink = await model.data[DISCIPL_FLINT_MODEL].acts.filter((actWithLink) => {
    return Object.keys(actWithLink).includes(act)
  }).map((actWithLink) => Object.values(actWithLink)[0])[0]

  logger.debug('Checking if action is possible from perspective of', ssid.did)
  if (await checkAction(modelLink, actLink, ssid, { ...context, 'caseLink': caseLink })) {
    logger.info('Registering act', actLink)
    return core.claim(ssid, { [DISCIPL_FLINT_ACT_TAKEN]: actLink, [DISCIPL_FLINT_GLOBAL_CASE]: firstCaseLink, [DISCIPL_FLINT_PREVIOUS_CASE]: caseLink })
  }

  throw new Error('Action is not allowed')
}

export {
  getAbundanceService,
  checkAction,
  evaluateFactFunction,
  checkExpression,
  publish,
  get,
  observe,
  take
}
