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
  '[Minister van Economische Zaken en Klimaat]': 'RVO'
}

const scenarios = [
  {
    name: 'ondernemer moet tegemoetkoming aan kunnen vragen',
    acts: [
      {
        act: '<<indienen aanvraag tegemoetkoming in de schade geleden door de maatregelen ter bestrijding van de verdere verspreiding van COVID-19>>',
        actor: 'onderneming'
      }
    ],
    facts: {
      '[verzoek tegemoetkoming in de schade geleden door de maatregelen ter bestrijding van de verdere verspreiding van COVID-19]': true,
      '[datum van oprichting van onderneming]': 20180101,
      '[datum van inschrijving van onderneming in het KVK Handelsregister]': 20180102,
      '[aantal personen dat werkt bij onderneming blijkend uit de inschrijving in het handelsregister op 15 maart 2020]': 10,
      '[SBI-code hoofdactiviteit onderneming]': '47.19.1',
      '[in Nederland gevestigde onderneming als bedoeld in artikel 5 van de Handelsregisterwet 2007]': true,
      '[onderneming heeft ten minste één vestiging met een ander adres dan het privéadres van de eigenaar of eigenaren van de onderneming]': true,
      '[naam contactpersoon bij de gedupeerde onderneming]': true,
      '[telefoonnummer contactpersoon bij de gedupeerde onderneming]': true,
      '[e-,mailadres contactpersoon bij de gedupeerde onderneming]': true,
      '[aanvraag omvat het postadres van de gedupeerde onderneming]': true,
      '[aanvraag omvat het bezoekadres van de gedupeerde onderneming]': true,
      '[aanvraag omvat het rekeningnummer dat op naam van de gedupeerde onderneming staat]': true,
      '[onderneming is niet failliet]': true,
      '[onderneming heeft geen verzoek tot verlening van surseance van betaling ingediend bij de rechtbank]': true,
      '[verklaring verwacht omzetverlies gedupeerde onderneming in de periode van 16 maart 2020 tot en met 15 juni 2020]': true,
      '[verklaring over vaste lasten gedupeerde onderneming in de periode van 16 maart 2020 tot en met 15 juni 2020]': true,
      '[gedupeerde onderneming verwacht in de periode van 16 maart 2020 tot en met 15 juni 2020 ten minste € 4000,- aan omzetverlies te lijden als gevolg van de maatregelen ter bestrijding van de verdere verspreiding van COVID-19]': true,
      '[aanvraag omvat een verklaring waarin de gedupeerde onderneming aangeeft dat de onderneming in de periode van 16 maart 2020 tot en met 15 juni 2020 verwacht ten minste € 4000,– aan vaste lasten te hebben, ook na gebruik van andere door de overheid beschikbaar gestelde steunmaatregelen in het kader van de bestrijding van de verdere verspreiding van COVID-19]': true,
      '[gedupeerde onderneming verwacht ten minste € 4.000,- aan vaste lasten te hebben, ook na gebruik van andere door de overheid beschikbaar gestelde steunmaatregelen in het kader van de bestrijding van de verdere verspreiding van COVID-19]': true,
      '[verwachte vaste lasten na gebruik van andere door de overheid beschikbaar gestelde steunmaatregelen in de periode van 16 maart 2020 t/m 15 juni 2020 ten minste € 4.000]': true,
      '[het totale bedrag aan de-minimissteun dat per lidstaat aan één onderneming wordt verleend, ligt hoger dan 200 000 EUR over een periode van drie belastingjaren]': true,
      '[aanvraag omvat een verklaring dat de gedupeerde onderneming geen overheidsbedrijf is]': true,
      '[aanvraag omvat een verklaring dat de gedupeerde onderneming op het moment van aanvraag voldoet aan de bij deze beleidsregel gestelde eisen]': true,
      '[aanvraag aanvraag is ingediend in de periode van 27 maart 2020 tot en met 26 juni 2020]': true
    }
  }
  ,
  {
    name: 'horeca-ondernemer met vestiging op prive-adres moet tegemoetkoming aan kunnen vragen',
    acts: [
      {
        act: '<<indienen aanvraag tegemoetkoming in de schade geleden door de maatregelen ter bestrijding van de verdere verspreiding van COVID-19>>',
        actor: 'onderneming'
      }
    ],
    facts: {
            '[verzoek tegemoetkoming in de schade geleden door de maatregelen ter bestrijding van de verdere verspreiding van COVID-19]': true,
      '[datum van oprichting van onderneming]': 20180101,
      '[datum van inschrijving van onderneming in het KVK Handelsregister]': 20180102,
      '[aantal personen dat werkt bij onderneming blijkend uit de inschrijving in het handelsregister op 15 maart 2020]': 10,
      '[SBI-code hoofdactiviteit onderneming]': '56.10.1',
      '[in Nederland gevestigde onderneming als bedoeld in artikel 5 van de Handelsregisterwet 2007]': true,
      '[onderneming heeft ten minste één vestiging met een ander adres dan het privéadres van de eigenaar of eigenaren van de onderneming]': false,
      '[horecaonderneming die ten minste één horecagelegenheid huurt, pacht of in eigendom heeft]': true,
      '[naam contactpersoon bij de gedupeerde onderneming]': true,
      '[telefoonnummer contactpersoon bij de gedupeerde onderneming]': true,
      '[e-,mailadres contactpersoon bij de gedupeerde onderneming]': true,
      '[aanvraag omvat het postadres van de gedupeerde onderneming]': true,
      '[aanvraag omvat het bezoekadres van de gedupeerde onderneming]': true,
      '[aanvraag omvat het rekeningnummer dat op naam van de gedupeerde onderneming staat]': true,
      '[onderneming is niet failliet]': true,
      '[onderneming heeft geen verzoek tot verlening van surseance van betaling ingediend bij de rechtbank]': true,
      '[verklaring verwacht omzetverlies gedupeerde onderneming in de periode van 16 maart 2020 tot en met 15 juni 2020]': true,
      '[verklaring over vaste lasten gedupeerde onderneming in de periode van 16 maart 2020 tot en met 15 juni 2020]': true,
      '[gedupeerde onderneming verwacht in de periode van 16 maart 2020 tot en met 15 juni 2020 ten minste € 4000,- aan omzetverlies te lijden als gevolg van de maatregelen ter bestrijding van de verdere verspreiding van COVID-19]': true,
      '[aanvraag omvat een verklaring waarin de gedupeerde onderneming aangeeft dat de onderneming in de periode van 16 maart 2020 tot en met 15 juni 2020 verwacht ten minste € 4000,– aan vaste lasten te hebben, ook na gebruik van andere door de overheid beschikbaar gestelde steunmaatregelen in het kader van de bestrijding van de verdere verspreiding van COVID-19]': true,
      '[gedupeerde onderneming verwacht ten minste € 4.000,- aan vaste lasten te hebben, ook na gebruik van andere door de overheid beschikbaar gestelde steunmaatregelen in het kader van de bestrijding van de verdere verspreiding van COVID-19]': true,
      '[verwachte vaste lasten na gebruik van andere door de overheid beschikbaar gestelde steunmaatregelen in de periode van 16 maart 2020 t/m 15 juni 2020 ten minste € 4.000]': true,
      '[het totale bedrag aan de-minimissteun dat per lidstaat aan één onderneming wordt verleend, ligt hoger dan 200 000 EUR over een periode van drie belastingjaren]': true,
      '[aanvraag omvat een verklaring dat de gedupeerde onderneming geen overheidsbedrijf is]': true,
      '[aanvraag omvat een verklaring dat de gedupeerde onderneming op het moment van aanvraag voldoet aan de bij deze beleidsregel gestelde eisen]': true,
      '[aanvraag aanvraag is ingediend in de periode van 27 maart 2020 tot en met 26 juni 2020]': true
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
