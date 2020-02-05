/* eslint-env mocha */
import Util from './../src/util'
import ANLb from './ANLb.flint'
import { LawReg } from '../src'
import * as log from 'loglevel'
log.getLogger('disciplLawReg').setLevel('debug')
const lawReg = new LawReg()

const util = new Util(lawReg)

const actors = ['RVO', 'collectief']

const factFunctionSpec = {
  '[RVO]': 'RVO',
  '[agrarisch collectief]': 'collectief'
}

const scenarios = [
  {
    name: 'Aanvraag, verantwoorden, beoordelen',
    acts: [
      {
        act: '<<indienen betalingsaanvraag>>',
        actor: 'collectief'
      },
      {
        act: '<<verantwoorden beheeractiviteiten en wijzigingen>>',
        actor: 'collectief'
      },
      {
        act: '<<beoordelen betalingsaanvraag>>',
        actor: 'RVO'
      }

    ],
    facts: {
      '[identiteit van de begunstigde]': true,
      '[De naam van de regeling]': true,
      '[De totale omvang in hectares in 2 decimalen per leefgebied/deelgebied waarvoor betaling wordt gevraagd]': 100,
      '[De ligging (geometrie)]': [true, false, true, false, true, false, true, false],
      '[Het leefgebied waartoe het perceel behoort.]': true,
      '[Indien van toepassing het deelgebied waartoe het perceel behoort.]': true,
      '[Omvang van de beheerde oppervlakte (in hectares in 2 decimalen voor landbouwgrond, die exact past bij de geometrie (uit eerste punt).]': [10, 10, 40, 40, 40, false],
      '[Aard van het grondgebruik (grasland, bouwland, landschapselement of water).]': true,
      '[De identificatie van niet-landbouwgrond die voor steun in aanmerking komt (subsidiabele landschapselementen (met uitzondering van hoogstamboomgaard, natuurvriendelijke oever en solitaire boom) en water).]': true,
      '[Verklaring van het agrarisch collectief dat de individuele deelnemers weten wat de verplichtingen en consequenties zijn]': true,
      '[De unieke identificatie van iedere deelnemer van het agrarisch collectief]': true,
      '[Aanvraagnummer gebiedsaanvraag (provincie) als bewijsstuk om te bepalen of de begunstigde voor betaling in aanmerking komt.]': true,
      '[De bewijsstukken die nodig zijn om te bepalen of de aanspraak op de steun/bijstand kan worden gemaakt. Hier moet worden gedacht aan stukken die de inhoud van de betalingsaanvraag onderbouwen]': true,
      '[betaalverzoek is tussen 1 maart en 15 mei ingediend]': true,
      '[goedgekeurde gebiedsaanvraag]': true,
      '[Het deelgebied waartoe het perceel behoort (indien van toepassing).]': true,
      '[De beheerfunctie waartoe het perceel behoort]': true,
      '[Opgave van de uitgevoerde beheeractiviteit (Nederlandse versie van de koppeltabel) of combinatie van beheeractiviteiten.]': true,
      '[kenmerk van de bijbehorende beschikking tot subsidieverlening van de gebiedsaanvraag]': true,
      '[De wijzigingen (ten opzichte van jaarlijks beheer) die doorgevoerd zijn op de beheeractiviteiten met reden van wijzigen en per welke datum (indien van toepassing).]': true,
      '[Digitale handtekening van de verantwoording]': true,
      '[verantwoording]': true,
      '[agrarisch collectief heeft subsidie ANLb ontvangen in betreffende provincie]': true,
      '[agrarisch collectief heeft een certificaat collectief agrarisch natuurbeheer verkregen van de Stichting certificering SNL voor de gehele subsidieperiode]': true,
      '[Er is een beheerplan]': true,
      '[Wijzigingen zijn ingediend voor 1 oktober van het betreffende jaar]': true,
      '[Meldingen zijn gedaan uiterlijk op 20 september van het lopende jaar]': true,
      '[Gecontroleerd is dat het minimale percentage dat genoemd is, is gehaald in de betreffende beheeractiviteit qua oppervlakte]': true,
      '[Vastgesteld is dat de reden van de wijziging van de beheeractiviteit geoorloofd is]': true,
      '[Vastgesteld is dat de wijziging of melding is toegestaan]': true,
      '[staan de opgegeven leefgebieden/deelgebieden ook in de beschikking tot subsidieverlening genoemd]': true,
      '[staan de opgegeven beheerfuncties in het betreffende leefgebied/deelgebied ook vermeld in de beschikking tot subsidieverlening]': true,
      '[ligt het perceel binnen het leefgebied/deelgebied zoals dit bepaald is op de kaart bij de beschikking van de gebiedsaanvraag]': true,
      '[indien er nadere voorwaarden in de beschikking tot subsidieverlening van de gebiedsaanvraag zijn opgenomen: wordt daar aan voldaan]': true,
      '[controle of de totale (netto) oppervlakte van de percelen per leefgebied (of deelgebied) binnen het minimum en maximum aantal hectares blijft, zoals vermeld in de beschikking tot subsidieverlening van de gebiedsaanvraag]': true,
      '[controle of het maximale subsidiebedrag per jaar per leefgebied of (indien van toepassing) deelgebied niet wordt overschreden]': true,
      '[de subsidieverlening is door de provincie verstrekt]': true,
      '[1,15]': 1.15
    }
  }

]

let ssids, modelLink
describe('in het ANLb model', () => {
  before(async () => {
    ({ ssids, modelLink } = await util.setupModel(ANLb, actors, factFunctionSpec, true))
  })

  for (let scenario of scenarios) {
    it(scenario.name, async () => {
      await util.scenarioTest(ssids, modelLink, scenario.acts, scenario.facts, true)
    })
  }
})
