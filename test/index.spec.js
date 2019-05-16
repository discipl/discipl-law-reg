/* eslint-env mocha */
import { expect } from 'chai'
import * as lawReg from '../src/index.js'

import awb from './flint-example-awb'
// import { loadConnector } from '../src/connector-loader.js'

describe('discipl-law-reg', () => {
  describe('The discipl-law-reg library', () => {
    it('test pegjs generator', async () => {
      let parsedFact = lawReg.evaluateFactFunction('(NIET [fact1]) OF ([fact2] EN [fact3])')
      console.log('uitkomst1: ', parsedFact)

      expect(parsedFact).to.deep.equal({
        'expression': 'OR',
        'operands': [
          {
            'expression': 'NOT',
            'operand': 'fact1'
          },
          {
            'expression': 'AND',
            'operands': [
              'fact2',
              'fact3'
            ]
          }
        ]
      })
    })

    it('should publish small example', async () => {
      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'interested-party': '[overheid]',
            'preconditions': '',
            'create': '<verwelkomen>',
            'terminate': '',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }, {
            'act': '<<fdsafadsf >>',
            'action': '[fdsa]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'interested-party': '[overheid]',
            'preconditions': '',
            'create': '<verwelkomen>',
            'terminate': '',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }, {
            'act': '<<fdsafadsf fdas>>',
            'action': '[fdsa fads]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'interested-party': '[overheid]',
            'preconditions': '',
            'create': '<verwelkomen>',
            'terminate': '',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }
        ],
        'facts': [
          { 'fact': '[ingezetene]', 'function': '', 'reference': 'art 1.1' },
          { 'fact': '[overheid]', 'function': '[aangesteld als ambtenaar]', 'reference': 'art 1.2' },
          { 'fact': '[betrokkene]', 'function': '[ingezetene] OF [overheid]', 'reference': 'art 1.3' },
          { 'fact': '[klacht]', 'function': '', 'reference': 'art 1.4' },
          { 'fact': '[verwelkomst]', 'function': '', 'reference': 'art 1.5' },
          { 'fact': '[binnen 14 dagen na aanvragen]', 'function': '', 'reference': 'art 2.2' },
          { 'fact': '[na 14 dagen geen verwelkomst]', 'function': '', 'reference': 'art 3.1' }
        ],
        'duties': [
          {
            'duty': '<verwelkomen binnen 14 dagen na aanvragen>',
            'duty-holder': '[overheid]',
            'claimant': '[ingezetene]',
            'create': '<<verwelkomen>>',
            'enforce': '<<klagen>>',
            'terminate': '',
            'reference': 'art 2.2, art 3.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }
        ]
      }

      let abundancesvc = lawReg.getAbundanceService()
      let core = abundancesvc.getCoreAPI()

      let ssid = await core.newSsid('ephemeral')

      let modelLink = await lawReg.publish(ssid, model)

      let modelReference = await core.get(modelLink, ssid)

      console.log(modelReference.data['DISCIPL_FLINT_MODEL'])

      let actsLink = modelReference.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']
      let factsLink = modelReference.data['DISCIPL_FLINT_MODEL'].facts[2]['[betrokkene]']
      let dutiesLink = modelReference.data['DISCIPL_FLINT_MODEL'].duties[0]['<verwelkomen binnen 14 dagen na aanvragen>']
      // console.log('facts in de log: ', modelReference.data['DISCIPL_FLINT_MODEL'].facts);
      // console.log(Object.values(modelReference.data['DISCIPL_FLINT_MODEL'].acts[0]));

      let actReference = await core.get(actsLink, ssid)
      let factReference = await core.get(factsLink, ssid)
      let dutyReference = await core.get(dutiesLink, ssid)

      lawReg.checkAction(modelLink, actsLink, ssid, '')

      expect(Object.keys(modelReference.data['DISCIPL_FLINT_MODEL'])).to.have.members(['model', 'acts', 'facts', 'duties'])

      expect(actReference.data['DISCIPL_FLINT_ACT']).to.deep.equal(
        {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'action': '[aanvragen]',
          'actor': '[ingezetene]',
          'object': '[verwelkomst]',
          'interested-party': '[overheid]',
          'preconditions': '',
          'create': '<verwelkomen>',
          'terminate': '',
          'reference': 'art 2.1',
          'sourcetext': '',
          'explanation': '',
          'version': '2-[19980101]-[jjjjmmdd]',
          'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
        }
      )

      expect(factReference.data['DISCIPL_FLINT_FACT']).to.deep.equal(
        { 'fact': '[betrokkene]', 'function': '[ingezetene] OF [overheid]', 'reference': 'art 1.3' }
      )

      expect(dutyReference.data['DISCIPL_FLINT_DUTY']).to.deep.equal({
        'duty': '<verwelkomen binnen 14 dagen na aanvragen>',
        'duty-holder': '[overheid]',
        'claimant': '[ingezetene]',
        'create': '<<verwelkomen>>',
        'enforce': '<<klagen>>',
        'terminate': '',
        'reference': 'art 2.2, art 3.1',
        'sourcetext': '',
        'explanation': '',
        'version': '2-[19980101]-[jjjjmmdd]',
        'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
      })

      expect(modelLink).to.be.a('string')
    })

    it('should be able to take an action', async () => {
      let core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'interested-party': '[overheid]',
            'preconditions': '',
            'create': '<verwelkomen>',
            'terminate': '',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }],
        'facts': [
          { 'fact': '[ingezetene]', 'function': '', 'reference': 'art 1.1' }
        ],
        'duties': []
      }

      let lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      let modelLink = await lawReg.publish(lawmakerSsid, model)

      let retrievedModel = await core.get(modelLink)

      let needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)
      let needLink = await core.claim(needSsid, { 'need': { 'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>', 'DISCIPL_FLINT_MODEL_LINK': modelLink } })

      let actorSsid = await core.newSsid('ephemeral')

      let factResolver = (fact) => true

      let actionLink = await lawReg.take(actorSsid, needLink, '<<ingezetene kan verwelkomst van overheid aanvragen>>', { 'factResolver': factResolver })

      let action = await core.get(actionLink, actorSsid)

      expect(action).to.deep.equal({
        'data': {
          'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
          'DISCIPL_FLINT_GLOBAL_CASE': needLink
        },
        'previous': null
      })
    })

    it('should be able to take an action dependent on recursive facts', async () => {
      let core = lawReg.getAbundanceService().getCoreAPI()

      let lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)

      let modelLink = await lawReg.publish(lawmakerSsid, { ...awb, 'model': 'AWB' })

      let retrievedModel = await core.get(modelLink)

      let needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)
      let needLink = await core.claim(needSsid, { 'need': { 'act': '<<indienen verzoek een besluit te nemen>>', 'DISCIPL_FLINT_MODEL_LINK': modelLink } })

      let actorSsid = await core.newSsid('ephemeral')

      let factResolver = (fact) => {
        return fact === '[persoon wiens belang rechtstreeks bij een besluit is betrokken]'
      }

      let actionLink = await lawReg.take(actorSsid, needLink, '<<indienen verzoek een besluit te nemen>>', { 'factResolver': factResolver })

      let action = await core.get(actionLink, actorSsid)

      expect(action).to.deep.equal({
        'data': {
          'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
          'DISCIPL_FLINT_GLOBAL_CASE': needLink
        },
        'previous': null
      })
    })

    //   it('should be able to publish and use a simple fictive flint model from JSON', async () => {

    //     /*

    //     Fictieve verwelkomingsregeling voor de Staat der Nederlanden

    //     De Staat der Nederlanden verklaart:

    //     1. Begripsbepalingen:

    //     artikel
    //     1.1 : ingezetene : Een ingezetene van de Staat der Nederlanden
    //     1.2 : overheid : Ambtenaar aangesteld door de Staat der Nederlanden
    //     1.3 : betrokkene : Een ingezetene van de Staat der Nederlanden of de Staat der Nederlanden zelf
    //     1.4 : klacht : een officiele klacht
    //     1.4 : verwelkomst : een verwelkoming

    //     2. Verwelkoming

    //     artikel
    //     2.1 : ingezetene kan verwelkomst van overheid aanvragen
    //     2.2 : overheid verwelkomt ingezetene binnen 14 dagen na aanvragen
    //     2.3 : betrokkene kan verwelkomst annuleren

    //     3. Klachtprocedure

    //     artikel
    //     3.1 : ingezetene kan klacht indienen bij overheid wanneer na 14 dagen geen verwelkomst is ontvangen

    //     */

    //     let abundancesvc = dlr.getAbundanceService()
    //     let core = abundancesvc.getCoreAPI()

    //     let ssid = core.newSsid('ephemeral')
    //     let mdl = await dlr.publish(ssid,
    //       {
    //         "model": "Fictieve verwelkomingsregeling Staat der Nederlanden",
    //         "acts": [
    //           { "act": "ingezetene kan verwelkomst van overheid aanvragen", "action": "aanvragen", "actor": "[ingezetene]", "object": "[verwelkomst]", "interested-party": "[overheid]", "preconditions": "", "create": "<verwelkomen>", "terminate": "", "reference": "art 2.1" },
    //           { "act": "overheid verwelkomt ingezetene", "action": "verwelkomen", "actor": "[overheid]", "object": "[verwelkomst]", "interested-party": "[ingezetene]", "preconditions": "", "create": "", "terminate": "", "reference": "art 2.2" },
    //           { "act": "betrokkene annuleert verwelkomst", "action": "annuleren", "actor": "[betrokkene]", "object": "[verwelkomst]", "interested-party": "[ingezetene]", "preconditions": "", "create": "", "terminate": "<verwelkomen>", "reference": "art 2.3" },
    //           { "act": "ingezetene kan klacht indienen wanneer na 14 dagen geen verwelkomst is ontvangen", "action": "klagen", "actor": "[betrokkene]", "object": "[klacht]", "interested-party": "[overheid]", "preconditions": "[na 14 dagen geen verwelkomst]", "create": "", "terminate": "", "reference": "art 3.1" }
    //         ],
    //         "facts": [
    //           { "fact": "ingezetene", "function": "", "reference": "art 1.1" },
    //           { "fact": "aangesteld als ambtenaar", "function": ssid.did, "art 1.2"},
    //           { "fact": "overheid", "function": "[aangesteld als ambtenaar]", "reference": "art 1.2" },
    //           { "fact": "betrokkene", "function": "[ingezetene] OF [overheid]", "reference": "art 1.3" },
    //           { "fact": "klacht", "function": "", "reference": "art 1.4" },
    //           { "fact": "verwelkomst", "function": "", "reference": "art 1.5" },
    //           { "fact": "binnen 14 dagen na aanvragen", "function": "", "reference": "art 2.2" },
    //           { "fact": "na 14 dagen geen verwelkomst", "function": "", "reference": "art 3.1" }
    //         ],
    //         "duties": [
    //           { "duty": "verwelkomen binnen 14 dagen na aanvragen", "duty-holder": "[overheid]", "claimant": "[ingezetene]", "create": "<<verwelkomen>>", "enforce": "<<klagen>>", "terminate": "", "reference": "art 2.2, art 3.1" }
    //         ]
    //       }
    //     )

    //     let modelexport = await core.exportLD(ssid.did)
    //     expect(modelexport).to.equal({

    //     })

    //     ssidIngezetene = core.newSsid('ephemeral')
    //     let status = dlr.get(mdl, ssidIngezetene.did)
    //     expect(status).to.equal({

    //     })

    //     ssidOverheid = core.newSsid('ephemeral')
    //     status = get(mdl, ssidOverheid.did)
    //     expect(status).to.equal({

    //     })

    //     let ambtenaarClaim = await core.claim(ssidOverheid, 'naam', 'Pietje Puk')
    //     await core.attest(ssid, 'aangesteld als ambtenaar', ambtenaarClaim)

    //     ssidOverheid = core.newSsid('ephemeral')
    //     status = get(mdl, ssidOverheid.did)
    //     expect(status).to.equal({

    //     })

    //     let observable = await dlr.observe(mdl, ssidOverheid)
    //     let observed = observable.pipe(take(1)).toPromise()

    //     let case = await dlr.take(ingezeteneSsid, null, status[], null)
    //     let observable2 = await dlr.observe(mdl, ssidIngezetene)
    //     let observed2 = observable2.pipe(take(1)).toPromise()

    //     status = await observed
    //     expect(status).to.equal({

    //     })

    //     await dlr.take(overheidSsid, status[].case, status[].act, 'Hello!')

    //     status = await observed2
    //     expect(status).to.equal({

    //     })

    //     // and when content with what really happened:
    //     abundancesvc.solved(case)

    //   })
    // }),
    //   describe('The discipl-law-reg library with mocked connector', () => {
    //     it('', async () => {

    //     })
  })
})
