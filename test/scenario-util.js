class Util {
  constructor (lawReg) {
    this.lawReg = lawReg
    this.core = lawReg.getAbundanceService().getCoreAPI()
  }
  async setupModel (model, actors, factFunctionSpec) {
    const allActors = actors.concat(['lawmaker'])
    console.log(allActors)
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

    console.log('Publishing')

    let modelLink = await this.lawReg.publish(ssids['lawmaker'], { ...model, 'model': 'LB' }, factFunctions)
    console.log({ 'ssids': ssids, 'modelLink': modelLink })
    return { 'ssids': ssids, 'modelLink': modelLink }
  }
}

export default Util
