/* eslint-env mocha */
import { expect } from 'chai'
import { LawReg } from '../src/index.js'
import * as log from 'loglevel'

import lb from './flint-example-lerarenbeurs'

// Adjusting log level for debugging can be done here, or in specific tests that need more finegrained logging during development
log.getLogger('disciplLawReg').setLevel('warn')

const lawReg = new LawReg()
const core = lawReg.getAbundanceService().getCoreAPI()

const factFunctionSpec = {
  '[persoon wiens belang rechtstreeks bij een besluit is betrokken]': 'belanghebbende',
  '[leraar]': 'belanghebbende',
  '[orgaan]': 'bestuursorgaan',
  '[rechtspersoon die krachtens publiekrecht is ingesteld]': 'bestuursorgaan',
  '[met enig openbaar gezag bekleed]': 'bestuursorgaan',
  '[bevoegd gezag]': 'bevoegdGezag',
  '[minister van Onderwijs, Cultuur en Wetenschap]': 'bestuursorgaan',
  '[persoon]': 'ANYONE'
}

const setupModel = async () => {
  const actors = ['lawmaker', 'belanghebbende', 'bestuursorgaan', 'bevoegdGezag']
  const ssids = {}

  for (let actor of actors) {
    ssids[actor] = await core.newSsid('ephemeral')
    await core.allow(ssids[actor])
  }

  const factFunctions = Object.keys(factFunctionSpec).reduce((factFunctions, fact) => {
    if (actors.includes(factFunctionSpec[fact])) {
      factFunctions[fact] = 'IS:' + ssids[factFunctionSpec[fact]].did
    } else {
      factFunctions[fact] = factFunctionSpec[fact]
    }
    return factFunctions
  }, {})

  let modelLink = await lawReg.publish(ssids['lawmaker'], { ...lb, 'model': 'LB' }, factFunctions)

  return { 'ssids': ssids, 'modelLink': modelLink }
}

let ssids, modelLink

describe('discipl-law-reg in scenarios with lerarenbeurs', () => {
  before(async () => {
    ({ ssids, modelLink } = await setupModel())
  })
  it('should be able to take an action where the object originates from another action - LERARENBEURS', async () => {
    let retrievedModel = await core.get(modelLink)

    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<indienen verzoek een besluit te nemen>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let belanghebbendeFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[verzoek een besluit te nemen]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['belanghebbende'], needLink, '<<indienen verzoek een besluit te nemen>>', belanghebbendeFactresolver)

    let bestuursorgaanFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[persoon wiens belang rechtstreeks bij een besluit is betrokken]' ||
          fact === '[aanvrager heeft de gelegenheid gehad de aanvraag aan te vullen]' ||
          fact === '[besluit om de aanvraag niet te behandelen wordt aan de aanvrager bekendgemaakt binnen vier weken nadat de aanvraag is aangevuld of nadat de daarvoor gestelde termijn ongebruikt is verstreken]'
      }
      return false
    }

    let secondActionLink = await lawReg.take(ssids['bestuursorgaan'], actionLink, '<<besluiten de aanvraag niet te behandelen>>', bestuursorgaanFactresolver)

    expect(secondActionLink).to.be.a('string')

    let action = await core.get(secondActionLink, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<besluiten de aanvraag niet te behandelen>>'))

    expect(action.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': actionLink
    })

    let takenActs = await lawReg.getActions(secondActionLink, ssids['belanghebbende'])
    expect(takenActs).to.deep.equal([{ 'act': '<<indienen verzoek een besluit te nemen>>', 'link': actionLink }, { 'act': '<<besluiten de aanvraag niet te behandelen>>', 'link': secondActionLink }])
  }).timeout(5000)

  it('should be able to determine available actions', async () => {
    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<indienen verzoek een besluit te nemen>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let allowedActs = await lawReg.getAvailableActs(needLink, ssids['belanghebbende'], ['[verzoek een besluit te nemen]'])

    let allowedActNames = allowedActs.map((act) => act.act)

    expect(allowedActNames).to.deep.equal(['<<indienen verzoek een besluit te nemen>>'])
  }).timeout(10000)

  it('should be able to determine potentially available actions', async () => {
    let { ssids, modelLink } = await setupModel()

    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<indienen verzoek een besluit te nemen>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let allowedActs = await lawReg.getPotentialActs(needLink, ssids['belanghebbende'], [])

    let allowedActNames = allowedActs.map((act) => act.act)

    expect(allowedActNames).to.deep.equal([
      '<<indienen verzoek een besluit te nemen>>',
      '<<leraar vraagt subsidie voor studiekosten aan>>',
      '<<leraar vraagt subsidie voor studieverlof voor het bevoegd gezag>>',
      '<<leraar overlegt bewijsstuk waaruit blijkt dat hij ten minste vijftien studiepunten heeft gehaald>>',
      '<<leraar overlegt bewijsstuk waaruit blijkt dat hij collegegeld heeft betaald>>',
      '<<inleveren of verzenden ingevuld aanvraagformulier lerarenbeurs>>'
    ])
  }).timeout(10000)

  it('should be able to determine potentially available actions from another perspective', async () => {
    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<indienen verzoek een besluit te nemen>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let allowedActs = await lawReg.getPotentialActs(needLink, ssids['bestuursorgaan'], [])

    let allowedActNames = allowedActs.map((act) => act.act)

    expect(allowedActNames).to.deep.equal([
      '<<vaststellen formulier voor verstrekken van gegevens>>',
      '<<minister laat een of meer bepalingen van de subsidieregeling lerarenbeurs buiten toepassing>>',
      '<<minister wijkt af van een of meer bepalingen van de subsidieregeling lerarenbeurs>>',
      '<<minister van OCW verdeelt het beschikbare bedrag voor de subsidieregeling lerarenbeurs per doelgroep>>',
      '<<minister van OCW berekent de hoogte van de subsidie voor studiekosten>>',
      '<<minister van OCW berekent de hoogte van de subsidie voor studieverlof>>',
      '<<aanvraagformulieren lerarenbeurs verstrekken>>'
    ])
  }).timeout(10000)

  it('should perform multiple acts for a happy flow in the context of Lerarenbeurs', async () => {
    let retrievedModel = await core.get(modelLink)
    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<leraar vraagt subsidie voor studiekosten aan>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let belanghebbendeFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[subsidie voor studiekosten]' ||
          fact === '[ingevuld aanvraagformulier op de website van de Dienst Uitvoering Onderwijs]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['belanghebbende'], needLink, '<<leraar vraagt subsidie voor studiekosten aan>>', belanghebbendeFactresolver)

    let bestuursorgaanFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[subsidie lerarenbeurs]' ||
          fact === '[subsidie voor bacheloropleiding leraar]' ||
          fact === '[leraar voldoet aan bevoegdheidseisen]' ||
          fact === '[leraar die bij aanvang van het studiejaar waarvoor de subsidie bestemd de graad Bachelor mag voeren]' ||
          fact === '[leraar die op het moment van de subsidieaanvraag in dienst is bij een werkgever]' ||
          fact === '[leraar werkt bij een of meer bekostigde onderwijsinstellingen]' ||
          fact === '[leraar die voor minimaal twintig procent van zijn werktijd is belast met lesgebonden taken]' ||
          fact === '[leraar die pedagogisch-didactisch verantwoordelijk is voor het onderwijs]' ||
          fact === '[leraar die ingeschreven staat in registerleraar.nl]' ||
          fact === '[subsidie wordt verstrekt voor één studiejaar en voor één opleiding]' ||
          fact === '[minister verdeelt het beschikbare bedrag per doelgroep over de aanvragen]'
      }
      return false
    }

    let secondActionLink = await lawReg.take(ssids['bestuursorgaan'], actionLink, '<<minister verstrekt subsidie lerarenbeurs aan leraar>>', bestuursorgaanFactresolver)

    expect(secondActionLink).to.be.a('string')

    let action = await core.get(secondActionLink, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<minister verstrekt subsidie lerarenbeurs aan leraar>>'))

    expect(action.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': actionLink
    })
  }).timeout(5000)

  it('should perform an extended happy flow in the context of Lerarenbeurs', async () => {
    let retrievedModel = await core.get(modelLink)
    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<aanvraagformulieren lerarenbeurs verstrekken>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let bestuursorgaanFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[aanvraagformulieren op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[schriftelijke beslissing van een bestuursorgaan]' ||
          fact === '[beslissing inhoudende een publiekrechtelijke rechtshandeling]' ||
          fact === '[subsidie lerarenbeurs]' ||
          fact === '[subsidie voor bacheloropleiding leraar]' ||
          fact === '[leraar voldoet aan bevoegdheidseisen]' ||
          fact === '[leraar werkt bij een of meer bekostigde onderwijsinstellingen]' ||
          fact === '[leraar die bij aanvang van het studiejaar waarvoor de subsidie bestemd de graad Bachelor mag voeren]' ||
          fact === '[leraar die op het moment van de subsidieaanvraag in dienst is bij een werkgever]' ||
          fact === '[leraar die voor minimaal twintig procent van zijn werktijd is belast met lesgebonden taken]' ||
          fact === '[leraar die pedagogisch-didactisch verantwoordelijk is voor het onderwijs]' ||
          fact === '[leraar die ingeschreven staat in registerleraar.nl]' ||
          fact === '[subsidie wordt verstrekt voor één studiejaar en voor één opleiding]' ||
          fact === '[minister verdeelt het beschikbare bedrag per doelgroep over de aanvragen]' ||
          fact === '[hoogte van de subsidie voor studiekosten]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['bestuursorgaan'], needLink, '<<aanvraagformulieren lerarenbeurs verstrekken>>', bestuursorgaanFactresolver)

    let belanghebbendeFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[ingevuld aanvraagformulier op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[inleveren]' ||
          fact === '[indienen 1 april tot en met 30 juni, voorafgaand aan het studiejaar waarvoor subsidie wordt aangevraagd]'
      }
      return false
    }

    let secondActionLink = await lawReg.take(ssids['belanghebbende'], actionLink, '<<inleveren of verzenden ingevuld aanvraagformulier lerarenbeurs>>', belanghebbendeFactresolver)
    let thirdActionLink = await lawReg.take(ssids['belanghebbende'], secondActionLink, '<<leraar vraagt subsidie voor studiekosten aan>>', belanghebbendeFactresolver)
    let fourthActionLink = await lawReg.take(ssids['bestuursorgaan'], thirdActionLink, '<<minister verstrekt subsidie lerarenbeurs aan leraar>>', bestuursorgaanFactresolver)
    let fifthActionLink = await lawReg.take(ssids['bestuursorgaan'], fourthActionLink, '<<minister van OCW berekent de hoogte van de subsidie voor studiekosten>>', bestuursorgaanFactresolver)
    let sixthActionLink = await lawReg.take(ssids['bestuursorgaan'], fifthActionLink, '<<bekendmaken van een besluit>>', bestuursorgaanFactresolver)

    expect(sixthActionLink).to.be.a('string')

    let thirdAction = await core.get(thirdActionLink, ssids['bestuursorgaan'])

    const expectedThirdActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<leraar vraagt subsidie voor studiekosten aan>>'))

    let lastAction = await core.get(sixthActionLink, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<bekendmaken van een besluit>>'))

    expect(thirdAction.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedThirdActLink[0])[0],
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': secondActionLink
    })

    expect(lastAction.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': fifthActionLink
    })
  }).timeout(5000)

  it('should perform an extended flow where teacher withdraws request in the context of Lerarenbeurs', async () => {
    let retrievedModel = await core.get(modelLink)
    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<aanvraagformulieren lerarenbeurs verstrekken>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let bestuursorgaanFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[aanvraagformulieren op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[schriftelijke beslissing van een bestuursorgaan]' ||
          fact === '[beslissing inhoudende een publiekrechtelijke rechtshandeling]' ||
          fact === '[subsidie lerarenbeurs]' ||
          fact === '[subsidie voor bacheloropleiding leraar]' ||
          fact === '[leraar voldoet aan bevoegdheidseisen]' ||
          fact === '[leraar werkt bij een of meer bekostigde onderwijsinstellingen]' ||
          fact === '[leraar die bij aanvang van het studiejaar waarvoor de subsidie bestemd de graad Bachelor mag voeren]' ||
          fact === '[leraar die op het moment van de subsidieaanvraag in dienst is bij een werkgever]' ||
          fact === '[leraar die voor minimaal twintig procent van zijn werktijd is belast met lesgebonden taken]' ||
          fact === '[leraar die pedagogisch-didactisch verantwoordelijk is voor het onderwijs]' ||
          fact === '[leraar die ingeschreven staat in registerleraar.nl]' ||
          fact === '[subsidie wordt verstrekt voor één studiejaar en voor één opleiding]' ||
          fact === '[minister verdeelt het beschikbare bedrag per doelgroep over de aanvragen]' ||
          fact === '[hoogte van de subsidie voor studiekosten]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['bestuursorgaan'], needLink, '<<aanvraagformulieren lerarenbeurs verstrekken>>', bestuursorgaanFactresolver)

    let belanghebbendeFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[ingevuld aanvraagformulier op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[inleveren]' ||
          fact === '[indienen 1 april tot en met 30 juni, voorafgaand aan het studiejaar waarvoor subsidie wordt aangevraagd]' ||
          fact === '[binnen twee maanden na het verstrekken van de subsidie]'
      }
      return false
    }

    let secondActionLink = await lawReg.take(ssids['belanghebbende'], actionLink, '<<inleveren of verzenden ingevuld aanvraagformulier lerarenbeurs>>', belanghebbendeFactresolver)
    let thirdActionLink = await lawReg.take(ssids['belanghebbende'], secondActionLink, '<<leraar vraagt subsidie voor studiekosten aan>>', belanghebbendeFactresolver)
    let fourthActionLink = await lawReg.take(ssids['bestuursorgaan'], thirdActionLink, '<<minister verstrekt subsidie lerarenbeurs aan leraar>>', bestuursorgaanFactresolver)
    let fifthActionLink = await lawReg.take(ssids['bestuursorgaan'], fourthActionLink, '<<minister van OCW berekent de hoogte van de subsidie voor studiekosten>>', bestuursorgaanFactresolver)
    let sixthActionLink = await lawReg.take(ssids['bestuursorgaan'], fifthActionLink, '<<bekendmaken van een besluit>>', bestuursorgaanFactresolver)
    let seventhActionLink = await lawReg.take(ssids['belanghebbende'], sixthActionLink, '<<leraar trekt aanvraag subsidie voor studieverlof in>>', belanghebbendeFactresolver)

    expect(seventhActionLink).to.be.a('string')

    let lastAction = await core.get(seventhActionLink, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<leraar trekt aanvraag subsidie voor studieverlof in>>'))

    expect(lastAction.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': sixthActionLink
    })
  }).timeout(5000)

  it('should perform an extended flow where minister refuses the request because they already got financing in the context of Lerarenbeurs', async () => {
    let retrievedModel = await core.get(modelLink)
    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<aanvraagformulieren lerarenbeurs verstrekken>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let bestuursorgaanFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[aanvraagformulieren op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[schriftelijke beslissing van een bestuursorgaan]' ||
          fact === '[beslissing inhoudende een publiekrechtelijke rechtshandeling]' ||
          fact === '[subsidie lerarenbeurs]' ||
          fact === '[subsidie voor bacheloropleiding leraar]' ||
          fact === '[leraar voldoet aan bevoegdheidseisen]' ||
          fact === '[leraar werkt bij een of meer bekostigde onderwijsinstellingen]' ||
          fact === '[leraar die bij aanvang van het studiejaar waarvoor de subsidie bestemd de graad Bachelor mag voeren]' ||
          fact === '[leraar die op het moment van de subsidieaanvraag in dienst is bij een werkgever]' ||
          fact === '[leraar die voor minimaal twintig procent van zijn werktijd is belast met lesgebonden taken]' ||
          fact === '[leraar die pedagogisch-didactisch verantwoordelijk is voor het onderwijs]' ||
          fact === '[leraar die ingeschreven staat in registerleraar.nl]' ||
          fact === '[subsidie wordt verstrekt voor één studiejaar en voor één opleiding]' ||
          fact === '[minister verdeelt het beschikbare bedrag per doelgroep over de aanvragen]' ||
          fact === '[hoogte van de subsidie voor studiekosten]' ||
          fact === '[subsidieverlening aan een leraar]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['bestuursorgaan'], needLink, '<<aanvraagformulieren lerarenbeurs verstrekken>>', bestuursorgaanFactresolver)

    let belanghebbendeFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[ingevuld aanvraagformulier op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[inleveren]' ||
          fact === '[indienen 1 april tot en met 30 juni, voorafgaand aan het studiejaar waarvoor subsidie wordt aangevraagd]'
      }
      return false
    }

    let secondActionLink = await lawReg.take(ssids['belanghebbende'], actionLink, '<<inleveren of verzenden ingevuld aanvraagformulier lerarenbeurs>>', belanghebbendeFactresolver)
    let thirdActionLink = await lawReg.take(ssids['belanghebbende'], secondActionLink, '<<leraar vraagt subsidie voor studiekosten aan>>', belanghebbendeFactresolver)
    log.getLogger('disciplLawReg').setLevel('debug')
    let fourthActionLink = await lawReg.take(ssids['bestuursorgaan'], thirdActionLink, '<<minister verstrekt subsidie lerarenbeurs aan leraar>>', bestuursorgaanFactresolver)

    let fifthActionLink = await lawReg.take(ssids['bestuursorgaan'], fourthActionLink, '<<minister van OCW weigert subsidieverlening aan een leraar>>', bestuursorgaanFactresolver)

    expect(fifthActionLink).to.be.a('string')

    let lastAction = await core.get(fifthActionLink, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<minister van OCW weigert subsidieverlening aan een leraar>>'))

    expect(lastAction.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': fourthActionLink
    })
  }).timeout(5000)
})
