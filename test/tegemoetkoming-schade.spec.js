/* eslint-env mocha */
import Util from './../src/util'
import VW from './tegemoetkoming-schade-covid19.flint'
import { LawReg } from '../src'
import * as log from 'loglevel'
log.getLogger('disciplLawReg').setLevel('warn')
const lawReg = new LawReg()

const util = new Util(lawReg)

const actors = ['onderneming', 'RVO']

const factFunctionSpec = {
  '[onderneming]': 'onderneming',
  '[RVO]': 'RVO'
}

const scenarios = [
  {
    name: 'ondernemer moet tegemoetkoming aan kunnen vragen',
    acts: [
      {
        act: '<<aanvragen tegemoetkoming schade covid-19>>',
        actor: 'onderneming'
      }
    ],
    facts: {
      '[verzoek]': true,
      '[datum van oprichting van onderneming]': 20180101,
      '[datum van inschrijving van onderneming in het KVK Handelsregister]': 20180102,
      '[aantal personen dat werkt bij onderneming]': 10,
      '[SBI-code hoofdactiviteit onderneming]': '47.19.1',
      '[onderneming heeft een fysieke vestiging in Nederland]': true,
      '[onderneming heeft ten minste één vestiging met een ander adres te hebben dan het privéadres van de eigenaar/eigenaren]': true,
      '[bankrekeningnummer op dat op naam van de onderneming staat]': true,
      '[onderneming is niet failliet]': true,
      '[onderneming heeft geen verzoek tot verlening van surseance van betaling ingediend bij de rechtbank]': true,
      '[verwacht omzetverlies in de periode van 16 maart 2020 t/m 15 juni 2020 van ten minste € 4.000]': true,
      '[verwachte vaste lasten na gebruik van andere door de overheid beschikbaar gestelde steunmaatregelen in de periode van 16 maart 2020 t/m 15 juni 2020 ten minste € 4.000]': true,
      '[ontvangen overheidssteuen over het huidige en de afgelopen 2 belastingjaren is niet meer dan € 200.000 aan overheidssteun]': true,
      '[onderneming is geen overheidsbedrijf]': true
    }
  },
  {
    name: 'horeca-ondernemer met vestiging op prive-adres moet tegemoetkoming aan kunnen vragen',
    acts: [
      {
        act: '<<aanvragen tegemoetkoming schade covid-19>>',
        actor: 'onderneming'
      }
    ],
    facts: {
      '[verzoek]': true,
      '[datum van oprichting van onderneming]': 20180101,
      '[datum van inschrijving van onderneming in het KVK Handelsregister]': 20180102,
      '[aantal personen dat werkt bij onderneming]': 10,
      '[SBI-code hoofdactiviteit onderneming]': '56.10.1',
      '[onderneming heeft een fysieke vestiging in Nederland]': true,
      '[onderneming heeft ten minste één vestiging met een ander adres te hebben dan het privéadres van de eigenaar/eigenaren]': false,
      '[onderneming huurt, pacht of heeft in eigendom in elk geval één horecagelegenheid]': true,
      '[bankrekeningnummer op dat op naam van de onderneming staat]': true,
      '[onderneming is niet failliet]': true,
      '[onderneming heeft geen verzoek tot verlening van surseance van betaling ingediend bij de rechtbank]': true,
      '[verwacht omzetverlies in de periode van 16 maart 2020 t/m 15 juni 2020 van ten minste € 4.000]': true,
      '[verwachte vaste lasten na gebruik van andere door de overheid beschikbaar gestelde steunmaatregelen in de periode van 16 maart 2020 t/m 15 juni 2020 ten minste € 4.000]': true,
      '[ontvangen overheidssteuen over het huidige en de afgelopen 2 belastingjaren is niet meer dan € 200.000 aan overheidssteun]': true,
      '[onderneming is geen overheidsbedrijf]': true
    }
  }

]

let ssids, modelLink
describe('in het tegemoetkoming model', () => {
  before(async () => {
    ({ ssids, modelLink } = await util.setupModel(VW, actors, factFunctionSpec, true))
  })

  for (const scenario of scenarios) {
    it(scenario.name, async () => {
      await util.scenarioTest(ssids, modelLink, scenario.acts, scenario.facts, true)
    })
  }
})
