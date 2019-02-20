
const core = require('discipl-core')

const publish = async (ssid, flint_ld_model) => {
  return core.claim(ssid, 'FLINT_LD_MODEL', flint_ld_model)
}

const getActiveCase = async (ssid, flint_ld_model_link) => {
  let model = new FlintModel(await core.get(flint_ld_model_link))
  for(action in model.startactions) {
    if(hasNeedFor(ssid, action.type)) {
      return new FlintCase(ssid, model)
    }
  }
}

const getRoles = (case) => {
  return case.model.roles
}

const getRoleDid = (case, role) => {
  return case.roleMapping[role.name]
}

const getPossibleActions = (case, role=null) => {
  // get actions for which a need has been expressed (for given role)
  let roles
  if(role) {
    roles = [role]
  }
  for(r in roles) {
    for(action in case.model.actions) {
      let did = getRoleDid(case, r)
      if(hasNeedFor(did, action.type)) {

      }
    }
  }
}

-getAction(case, action-reference)
-getActionState(case, action)
-getPrecondition(case, action)
-evalPrecondition(case, action)
-getFact(case, fact-reference)
-evalFact(case, fact)
-getDuty(case, duty-reference)
-getCurrentDuties(case, role)
-getPossibleSanctions(case, duty-reference)
-observe(ssid, role, flint-ld-model-link) : returns set of Promises to which event handlers can be tied
-take(action, object=null)

module.exports = {
  publish,
  getActiveCase,
  getRoles,
  getRoleDid,
  getPossibleActions,
  getAction,
  getActionState,
  getPrecondition,
  evalPrecondition,
  getFact,
  evalFact,
  getDuty,
  getCurrentDuties,
  getPossibleSanctions,
  subscribe,
  take
}
