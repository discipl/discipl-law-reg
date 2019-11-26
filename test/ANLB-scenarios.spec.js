/* eslint-env mocha */
import Util from './scenario-util'
import ANLb from './ANLb.flint'
import { LawReg } from '../src'
import * as log from 'loglevel'
log.getLogger('disciplLawReg').setLevel('warn')
const lawReg = new LawReg()

const util = new Util(lawReg)

const actors = ['RVO', 'collectief']

const factFunctionSpec = {
  '[RVO]': 'RVO',
  '[agrarisch collectief]': 'collectief'
}

const scenarios = [
  {
    name: 'moet een collectief een aanvraag kunnen doen',
    acts: [
      {
        act: '<<indienen betalingsaanvraag>>',
        actor: 'collectief'
      }
    ],
    facts: {
      '[toegekende gebiedsaanvraag]': true,
      '[De identiteit van de begunstigde]': true,
      '[De naam van de regeling]': true,
      '[De totale omvang in hectares in 2 decimalen per leefgebied/deelgebied waarvoor betaling wordt gevraagd]': true,
      '[De ligging (geometrie).]': [true, false],
      '[Het leefgebied waartoe het perceel behoort.]': true,
      '[Indien van toepassing het deelgebied waartoe het perceel behoort.]': true,
      '[Omvang van de beheerde oppervlakte (in hectares in 2 decimalen voor landbouwgrond, die exact past bij de geometrie (uit eerste punt).]': true,
      '[Aard van het grondgebruik (grasland, bouwland, landschapselement of water).]': true,
      '[De identificatie van niet-landbouwgrond die voor steun in aanmerking komt (subsidiabele landschapselementen (met uitzondering van hoogstamboomgaard, natuurvriendelijke oever en solitaire boom) en water).]': true,
      '[Verklaring van het agrarisch collectief dat de individuele deelnemers weten wat de verplichtingen en consequenties zijn]': true,
      '[De unieke identificatie van iedere deelnemer van het agrarisch collectief]': true,
      '[Aanvraagnummer gebiedsaanvraag (provincie) als bewijsstuk om te bepalen of de begunstigde voor betaling in aanmerking komt.]': true,
      '[De bewijsstukken die nodig zijn om te bepalen of de aanspraak op de steun/bijstand kan worden gemaakt. Hier moet worden gedacht aan stukken die de inhoud van de betalingsaanvraag onderbouwen]': true,
      '[betaalverzoek is tussen 1 maart en 15 mei ingediend]': true
    }
  }

]

let ssids, modelLink
describe('in het ANLb model', () => {
  before(async () => {
    ({ ssids, modelLink } = await util.setupModel(ANLb, actors, factFunctionSpec))
    console.log({ ssids, modelLink })
  })

  for (let scenario of scenarios) {
    it(scenario.name, async () => {
      await util.scenarioTest(ssids, modelLink, scenario.acts, scenario.facts)
    })
  }
})
