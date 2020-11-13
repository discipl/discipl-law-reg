/* eslint-env mocha */
import Util from '../src/utils/util'
import VW from './Vreemdelingenwet.flint'
import { LawReg } from '../src'
import * as log from 'loglevel'
log.getLogger('disciplLawReg').setLevel('warn')
const lawReg = new LawReg()

const util = new Util(lawReg)

const actors = ['IND', 'vreemdeling', 'referent', 'erkend referent', 'Staatssecretaris van Justitie en Veiligheid']

const factFunctionSpec = {
  '[Onze Minister van Justitie en Veiligheid]': 'IND',
  '[bestuursorgaan]': 'IND',
  '[vreemdeling]': 'vreemdeling',
  '[belanghebbende]': 'vreemdeling'
}

const scenarios = [
  {
    name: 'moet de IND een vvr bep kunnen verlenen',
    acts: [
      {
        act: '<<inwilligen aanvraag tot het verlenen van een vvr-bep>>',
        actor: 'IND'
      }
    ],
    facts: {
      '[aanvraag tot het verlenen van een vvr-bep]': true,
      '[vreemdeling laat een gezichtsopname en tien vingerafdrukken afnemen]': true,
      '[verblijf als familie- of gezinslid]': true,
      '[vreemdeling beschikt over een geldige machtiging tot voorlopig verblijf]': true,
      '[vreemdeling beschikt over een geldig document voor grensoverschrijding]': true,
      '[vreemdeling beschikt over middelen van bestaan]': false,
      '[persoon bij wie de vreemdeling wil verblijven beschikt over middelen van bestaan]': true,
      '[middelen van bestaan zijn verworven uit wettelijk toegestane arbeid in loondienst]': true,
      '[vereiste premies zijn afgedragen]': true,
      '[vereiste belastingen zijn afgedragen]': true,
      '[middelen van bestaan zijn nog één jaar beschikbaar zijn op het tijdstip waarop de aanvraag is ontvangen]': true,
      '[Het minimumloon bedraagt € 1653,60 per maand]': 1653.50,
      '[vakantiebijslag minimum, bedoeld in art. 15 Wml]': 0.08 * 1653.50,
      '[middelen van bestaan]': 5000,
      '[Vul in 1.5 voor factor 150%]': 1.5,
      '[vreemdeling vormt een gevaar voor de openbare orde of nationale veiligheid]': false,
      '[vreemdeling is bereid om medewerking te verlenen aan een medisch onderzoek naar een ziekte aangewezen bij of krachtens de Wpg of een medische behandeling tegen een dergelijke ziekte te ondergaan]': true,
      '[vreemdeling voor een werkgever arbeid heeft verricht, zonder dat aan de Wet arbeid vreemdelingen is voldaan]': false,
      '[vreemdeling voldoet aan de beperking, verband houdende met het doel waarvoor hij wil verblijven]': true,
      '[vreemdeling beschikt over kennis op basisniveau van de Nederlandse taal en de Nederlandse maatschappij]': true,
      '[vreemdeling heeft onjuiste gegevens verstrekt dan wel gegevens achtergehouden]': false,
      '[vreemdeling heeft in Nederland verblijf gehouden, anders dan op grond van art. 8 Vw]': false,
      '[ten behoeve van het verblijf van de vreemdeling is een verklaring van een referent overgelegd als bedoeld in art. 2a lid 1 Vw]': true,
      '[vreemdeling is leges verschuldigd terzake van de afdoening van een aanvraag]': false,
      '[dag waarop de vreemdeling heeft aangetoond dat hij aan alle voorwaarden van een vvr voldoet]': true,
      '[dag waarop de vreemdeling heeft aangetoond dat hij aan alle voorwaarden van een vvr voldoet ligt voor de dag waarop de aanvraag is ontvangen]': false,
      '[vreemdeling heeft inreisverbod of is gesignaleerd ter fine van weigering van de toegang]': false,
      '[ongewenst verklaarde vreemdeling]': false
    }
  }

]

let ssids, modelLink
describe('in het VW model', () => {
  before(async () => {
    ({ ssids, modelLink } = await util.setupModel(VW, actors, factFunctionSpec, true))
  })

  for (const scenario of scenarios) {
    it(scenario.name, async () => {
      await util.scenarioTest(ssids, modelLink, scenario.acts, scenario.facts, true)
    })
  }
})
