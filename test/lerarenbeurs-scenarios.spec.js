/* eslint-env mocha */
import { expect } from 'chai'
import { LawReg } from '../src/index.js'
import * as log from 'loglevel'
import Util from './../src/util'

import lb from './flint-example-lerarenbeurs'

// Adjusting log level for debugging can be done here, or in specific tests that need more finegrained logging during development
log.getLogger('disciplLawReg').setLevel('warn')

const lawReg = new LawReg()
const core = lawReg.getAbundanceService().getCoreAPI()

const factFunctionSpec = {
  '[persoon wiens belang rechtstreeks bij een besluit is betrokken]': 'belanghebbende',
  '[degene die voldoet aan bevoegdheidseisen gesteld in]': 'belanghebbende',
  '[artikel 3 van de Wet op het primair onderwijs]': 'belanghebbende',
  '[artikel 3 van de Wet op de expertisecentra]': 'belanghebbende',
  '[artikel XI van de Wet op de beroepen in het onderwijs]': 'belanghebbende',
  '[artikel 3 van de Wet primair onderwijs BES]': 'belanghebbende',
  '[is benoemd of tewerkgesteld zonder benoeming als bedoeld in artikel 33 van de Wet op het voortgezet onderwijs]': 'belanghebbende',
  '[artikel 4.2.1. van de Wet educatie en beroepsonderwijs]': 'belanghebbende',
  '[artikel 80 van de Wet voortgezet onderwijs BES]': 'belanghebbende',
  '[artikel 4.2.1 van de Wet educatie beroepsonderwijs BES]': 'belanghebbende',
  '[die lesgeeft in het hoger onderwijs]': 'belanghebbende',
  '[orgaan]': 'bestuursorgaan',
  '[rechtspersoon die krachtens publiekrecht is ingesteld]': 'bestuursorgaan',
  '[met enig openbaar gezag bekleed]': 'bestuursorgaan',
  '[artikel 1 van de Wet op het primair onderwijs]': 'bevoegdGezag',
  '[artikel 1 van de Wet op de expertisecentra]': 'bevoegdGezag',
  '[artikel 1 van de Wet op het voortgezet onderwijs]': 'bevoegdGezag',
  '[artikel 1.1.1., onderdeel w, van de Wet educatie en beroepsonderwijs]': 'bevoegdGezag',
  '[artikel 1 van de Wet primair onderwijs BES]': 'bevoegdGezag',
  '[artikel 1 van de Wet voortgezet onderwijs BES]': 'bevoegdGezag',
  '[artikel 1.1.1, van de Wet educatie en beroepsonderwijs BES]': 'bevoegdGezag',
  '[instellingsbestuur bedoeld in artikel 1.1, onderdeel j, van de Wet op het hoger onderwijs en wetenschappelijk onderzoek]': 'bevoegdGezag',
  '[minister van Onderwijs, Cultuur en Wetenschap]': 'bestuursorgaan',
  '[persoon]': 'ANYONE'
}

const setupModel = async () => {
  console.log('Setup model')
  const util = new Util(lawReg)
  return util.setupModel(lb, ['belanghebbende', 'bestuursorgaan', 'bevoegdGezag'], factFunctionSpec)
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
          fact === '[de aanvraag is binnen de afgelopen 4 weken aangevuld]'
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
      'DISCIPL_FLINT_FACTS_SUPPLIED': {
        '[aanvrager heeft de gelegenheid gehad de aanvraag aan te vullen]': true,
        '[aanvrager heeft voldaan aan enig wettelijk voorschrift voor het in behandeling nemen van de aanvraag]': false,
        '[de aanvraag is binnen de afgelopen 4 weken aangevuld]': true
      },
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

    let allowedActs = await lawReg.getAvailableActs(needLink, ssids['belanghebbende'], ['[verzoek een besluit te nemen]'], ['[bij wettelijk voorschrift is anders bepaald]'])

    let allowedActNames = allowedActs.map((act) => act.act)

    expect(allowedActNames).to.deep.equal(['<<indienen verzoek een besluit te nemen>>'])
  }).timeout(10000)

  it('should be able to determine available actions with nonfacts', async () => {
    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<indienen verzoek een besluit te nemen>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let allowedActs = await lawReg.getAvailableActs(needLink, ssids['belanghebbende'], [], ['[verzoek een besluit te nemen]'])

    let allowedActNames = allowedActs.map((act) => act.act)

    expect(allowedActNames).to.deep.equal([])
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
      '<<indienen verzoek een besluit te nemen>>'
    ])
  }).timeout(10000)

  it('should be able to determine potentially available actions with non-facts', async () => {
    let { ssids, modelLink } = await setupModel()

    let needSsid = await core.newSsid('ephemeral')

    await core.allow(needSsid)
    let needLink = await core.claim(needSsid, {
      'need': {
        'act': '<<indienen verzoek een besluit te nemen>>',
        'DISCIPL_FLINT_MODEL_LINK': modelLink
      }
    })

    let allowedActs = await lawReg.getPotentialActs(needLink, ssids['belanghebbende'], [], ['[verzoek een besluit te nemen]'])

    let allowedActNames = allowedActs.map((act) => act.act)

    expect(allowedActNames).to.deep.equal([])
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
      '<<minister treft betalingsregeling voor het terugbetalen van de subsidie voor studiekosten>>',
      '<<minister laat een of meer bepalingen van de subsidieregeling lerarenbeurs buiten toepassing>>',
      '<<minister wijkt af van een of meer bepalingen van de subsidieregeling lerarenbeurs>>',
      '<<minister van OCW verdeelt het beschikbare bedrag voor de subsidieregeling lerarenbeurs per doelgroep>>',
      '<<minister van OCW verdeelt concreet het beschikbare budget in een studiejaar per soort onderwijs>>',
      '<<minister van OCW berekent de hoogte van de subsidie voor studiekosten>>',
      '<<minister van OCW berekent de hoogte van de subsidie voor studieverlof>>',
      '<<aanvraagformulieren verstrekken voor subsidie studiekosten op de website van de DUO>>',
      '<<aanvraagformulieren verstrekken voor subsidie studieverlof op de website van de DUO>>'
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
          fact === '[ingevuld aanvraagformulier studiekosten op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[indienen 1 april tot en met 30 juni, voorafgaand aan het studiejaar waarvoor subsidie wordt aangevraagd]'
      }
      return false
    }

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
          fact === '[minister verdeelt het beschikbare bedrag per doelgroep over de aanvragen]' ||
          fact === '[template voor aanvraagformulieren studiekosten]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['bestuursorgaan'], needLink, '<<aanvraagformulieren verstrekken voor subsidie studiekosten op de website van de DUO>>', bestuursorgaanFactresolver)

    let actionLink2 = await lawReg.take(ssids['belanghebbende'], actionLink, '<<leraar vraagt subsidie voor studiekosten aan>>', belanghebbendeFactresolver)

    let actionLink3 = await lawReg.take(ssids['bestuursorgaan'], actionLink2, '<<minister verstrekt subsidie lerarenbeurs aan leraar>>', bestuursorgaanFactresolver)

    let action = await core.get(actionLink3, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<minister verstrekt subsidie lerarenbeurs aan leraar>>'))

    expect(action.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_FACTS_SUPPLIED': {
        '[budget volledig benut]': false,
        '[leraar die bij aanvang van het studiejaar waarvoor de subsidie bestemd de graad Bachelor mag voeren]': true,
        '[leraar die ingeschreven staat in registerleraar.nl]': true,
        '[leraar die op het moment van de subsidieaanvraag in dienst is bij een werkgever]': true,
        '[leraar die pedagogisch-didactisch verantwoordelijk is voor het onderwijs]': true,
        '[leraar die voor minimaal twintig procent van zijn werktijd is belast met lesgebonden taken]': true,
        '[leraar is aangesteld als ambulant begeleider]': false,
        '[leraar is aangesteld als intern begeleider]': false,
        '[leraar is aangesteld als remedial teacher]': false,
        '[leraar is aangesteld als zorgcoördinator]': false,
        '[leraar ontvangt van de minister een tegemoetkoming in de studiekosten voor het volgen van de opleiding]': false,
        '[leraar werkt bij een of meer bekostigde onderwijsinstellingen]': true,
        '[minister verdeelt het beschikbare bedrag per doelgroep over de aanvragen]': true,
        '[subsidie lerarenbeurs]': true,
        '[subsidie voor bacheloropleiding leraar]': true,
        '[subsidie wordt verstrekt voor één studiejaar en voor één opleiding]': true
      },
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': actionLink2
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
        return fact === '[template voor aanvraagformulieren op de website van de Dienst Uitvoering Onderwijs]' ||
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
          fact === '[template voor aanvraagformulieren studiekosten]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['bestuursorgaan'], needLink, '<<aanvraagformulieren verstrekken voor subsidie studiekosten op de website van de DUO>>', bestuursorgaanFactresolver)

    let belanghebbendeFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[aanvraagformulieren op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[ingevuld aanvraagformulier studiekosten op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[inleveren]' ||
          fact === '[indienen 1 april tot en met 30 juni, voorafgaand aan het studiejaar waarvoor subsidie wordt aangevraagd]'
      }
      return false
    }

    let actionLink2 = await lawReg.take(ssids['belanghebbende'], actionLink, '<<leraar vraagt subsidie voor studiekosten aan>>', belanghebbendeFactresolver)
    let actionLink3 = await lawReg.take(ssids['bestuursorgaan'], actionLink2, '<<minister verstrekt subsidie lerarenbeurs aan leraar>>', bestuursorgaanFactresolver)
    let actionLink4 = await lawReg.take(ssids['bestuursorgaan'], actionLink3, '<<minister van OCW berekent de hoogte van de subsidie voor studiekosten>>', bestuursorgaanFactresolver)

    let thirdAction = await core.get(actionLink2, ssids['bestuursorgaan'])

    const expectedThirdActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<leraar vraagt subsidie voor studiekosten aan>>'))

    let lastAction = await core.get(actionLink4, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<minister van OCW berekent de hoogte van de subsidie voor studiekosten>>'))

    expect(thirdAction.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedThirdActLink[0])[0],
      'DISCIPL_FLINT_FACTS_SUPPLIED': {
        '[indienen 1 april tot en met 30 juni, voorafgaand aan het studiejaar waarvoor subsidie wordt aangevraagd]': true,
        '[ingevuld aanvraagformulier studiekosten op de website van de Dienst Uitvoering Onderwijs]': true
      },
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': actionLink
    })

    expect(lastAction.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_FACTS_SUPPLIED': {
        '[hoogte van de subsidie voor studiekosten]': true
      },
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': actionLink3
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
        return fact === '[template voor aanvraagformulieren op de website van de Dienst Uitvoering Onderwijs]' ||
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
          fact === '[template voor aanvraagformulieren studiekosten]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['bestuursorgaan'], needLink, '<<aanvraagformulieren verstrekken voor subsidie studiekosten op de website van de DUO>>', bestuursorgaanFactresolver)

    let belanghebbendeFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[aanvraagformulieren op de website van de Dienst Uitvoering Onderwijs]' ||
        fact === '[ingevuld aanvraagformulier studiekosten op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[inleveren]' ||
          fact === '[indienen 1 april tot en met 30 juni, voorafgaand aan het studiejaar waarvoor subsidie wordt aangevraagd]' ||
          fact === '[binnen twee maanden na het verstrekken van de subsidie]'
      }
      return false
    }

    let actionLink2 = await lawReg.take(ssids['belanghebbende'], actionLink, '<<leraar vraagt subsidie voor studiekosten aan>>', belanghebbendeFactresolver)
    let actionLink3 = await lawReg.take(ssids['belanghebbende'], actionLink2, '<<leraar trekt aanvraag subsidie voor studiekosten in>>', belanghebbendeFactresolver)

    expect(actionLink3).to.be.a('string')

    let lastAction = await core.get(actionLink3, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<leraar trekt aanvraag subsidie voor studiekosten in>>'))

    expect(lastAction.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_FACTS_SUPPLIED': {
        '[binnen twee maanden na het verstrekken van de subsidie]': true
      },
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': actionLink2
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
        return fact === '[template voor aanvraagformulieren op de website van de Dienst Uitvoering Onderwijs]' ||
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
          fact === '[subsidieverlening aan een leraar]' ||
          fact === '[template voor aanvraagformulieren studiekosten]'
      }
      return false
    }

    let actionLink = await lawReg.take(ssids['bestuursorgaan'], needLink, '<<aanvraagformulieren verstrekken voor subsidie studiekosten op de website van de DUO>>', bestuursorgaanFactresolver)

    let belanghebbendeFactresolver = (fact) => {
      if (typeof fact === 'string') {
        return fact === '[ingevuld aanvraagformulier studiekosten op de website van de Dienst Uitvoering Onderwijs]' ||
          fact === '[inleveren]' ||
          fact === '[indienen 1 april tot en met 30 juni, voorafgaand aan het studiejaar waarvoor subsidie wordt aangevraagd]'
      }
      return false
    }

    let actionLink2 = await lawReg.take(ssids['belanghebbende'], actionLink, '<<leraar vraagt subsidie voor studiekosten aan>>', belanghebbendeFactresolver)
    let actionLink3 = await lawReg.take(ssids['bestuursorgaan'], actionLink2, '<<minister verstrekt subsidie lerarenbeurs aan leraar>>', bestuursorgaanFactresolver)

    let actionLink4 = await lawReg.take(ssids['bestuursorgaan'], actionLink3, '<<minister van OCW weigert subsidieverlening aan een leraar>>', bestuursorgaanFactresolver)

    let lastAction = await core.get(actionLink4, ssids['bestuursorgaan'])

    const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
      .filter(item => Object.keys(item).includes('<<minister van OCW weigert subsidieverlening aan een leraar>>'))

    expect(lastAction.data).to.deep.equal({
      'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
      'DISCIPL_FLINT_FACTS_SUPPLIED': {
        '[subsidieverlening aan een leraar]': true
      },
      'DISCIPL_FLINT_GLOBAL_CASE': needLink,
      'DISCIPL_FLINT_PREVIOUS_CASE': actionLink3
    })
  }).timeout(5000)
})
