class Util {
  constructor (lawReg) {
    this.lawReg = lawReg
    this.core = lawReg.getAbundanceService().getCoreAPI()
  }

  async setupModel (model, actors, factFunctionSpec) {
    const allActors = actors.concat(['lawmaker'])
    const ssids = {}

    for (let actor of allActors) {
      ssids[actor] = await this.core.newSsid('ephemeral')
      await this.core.allow(ssids[actor])
    }

    const factFunctions = Object.keys(factFunctionSpec).reduce((factFunctions, fact) => {
      if (allActors.includes(factFunctionSpec[fact])) {
        factFunctions[fact] = 'IS:' + ssids[factFunctionSpec[fact]].did
      } else {
        factFunctions[fact] = factFunctionSpec[fact]
      }
      return factFunctions
    }, {})

    let modelLink = await this.lawReg.publish(ssids['lawmaker'], { ...model, 'model': 'LB' }, factFunctions)

    return { 'ssids': ssids, 'modelLink': modelLink }
  }

  async scenarioTest (ssids, modelLink, acts, facts) {
    let needSsid = await this.core.newSsid('ephemeral')

    await this.core.allow(needSsid)
    let needLink = await this.core.claim(needSsid, {
      'need': {
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let caseLink = needLink

    const factResolver = (fact) => {
      if (facts[fact]) {
        if (Array.isArray(facts[fact])) {
          return facts[fact].shift()
        } else {
          return facts[fact]
        }
      }
      return false
    }

    for (let act of acts) {
      caseLink = await this.lawReg.take(ssids[act.actor], caseLink, act.act, factResolver)
    }
  }
}

export default Util
