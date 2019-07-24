/* eslint-env mocha */
import { expect } from 'chai'

import sinon from 'sinon'
import { LawReg } from '../src/index.js'
import * as log from 'loglevel'

import awb from './flint-example-awb'

// Adjusting log level for debugging can be done here, or in specific tests that need more finegrained logging during development
log.getLogger('disciplLawReg').setLevel('warn')

const lawReg = new LawReg()

describe('discipl-law-reg', () => {
  describe('The discipl-law-reg library', () => {
    it('correctly parses and solves a single fact', async () => {
      let parsedFact = lawReg.factParser.parse('[fact1]')

      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        return fact === '[fact1]'
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(true)

      expect(parsedFact).to.deep.equal(
        '[fact1]'
      )
    })

    it('correctly parses and solves a single NOT fact', async () => {
      let parsedFact = lawReg.factParser.parse('NIET [fact1]')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        return fact === '[fact2]'
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(true)

      expect(parsedFact).to.deep.equal({
        'expression': 'NOT',
        'operand': '[fact1]'
      })
    })

    it('correctly parses a multiple AND construction', async () => {
      let parsedFact = lawReg.factParser.parse('[fact1] EN [fact2] EN [fact3]')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        return fact === '[fact1]' || fact === '[fact2]' || fact === '[fact3]'
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(true)

      expect(parsedFact).to.deep.equal({
        'expression': 'AND',
        'operands': [
          '[fact1]',
          '[fact2]',
          '[fact3]'
        ]
      })
    })

    it('correctly parses a multiple AND construction with undefined', async () => {
      let parsedFact = lawReg.factParser.parse('[fact1] EN [fact2] EN [fact3]')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        if (fact === '[fact1]' || fact === '[fact2]') {
          return true
        }
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      // eslint-disable-next-line no-unused-expressions
      expect(result).to.be.undefined

      expect(parsedFact).to.deep.equal({
        'expression': 'AND',
        'operands': [
          '[fact1]',
          '[fact2]',
          '[fact3]'
        ]
      })
    })

    it('correctly parses a multiple OR construction', async () => {
      let parsedFact = lawReg.factParser.parse('[fact1] OF [fact2] OF [fact3]')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        return fact === '[fact2]'
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(true)

      expect(parsedFact).to.deep.equal({
        'expression': 'OR',
        'operands': [
          '[fact1]',
          '[fact2]',
          '[fact3]'
        ]
      })
    })

    it('correctly parses a multiple OR construction with undefined short-circuited', async () => {
      let parsedFact = lawReg.factParser.parse('[fact1] OF [fact2] OF [fact3]')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        if (fact === '[fact2]') {
          return true
        }
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(true)

      expect(parsedFact).to.deep.equal({
        'expression': 'OR',
        'operands': [
          '[fact1]',
          '[fact2]',
          '[fact3]'
        ]
      })
    })

    it('Does not find a match inside a multiple AND construction', async () => {
      let parsedFact = lawReg.factParser.parse('[fact1] EN [fact2]')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        return fact === '[fact3]'
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(false)

      expect(parsedFact).to.deep.equal({
        'expression': 'AND',
        'operands': [
          '[fact1]',
          '[fact2]'
        ]
      })
    })

    it('Does not find a match inside a multiple OR construction', async () => {
      let parsedFact = lawReg.factParser.parse('[fact1] OF [fact2]')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        return fact === '[fact3]'
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(false)

      expect(parsedFact).to.deep.equal({
        'expression': 'OR',
        'operands': [
          '[fact1]',
          '[fact2]'
        ]
      })
    })

    it('correctly parses and solves an OR construction with a NOT and AND construction inside', async () => {
      let parsedFact = lawReg.factParser.parse('(NIET [fact1]) OF ([fact2] EN [fact3])')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        return fact === '[fact]'
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(true)

      expect(parsedFact).to.deep.equal({
        'expression': 'OR',
        'operands': [
          {
            'expression': 'NOT',
            'operand': '[fact1]'
          },
          {
            'expression': 'AND',
            'operands': [
              '[fact2]',
              '[fact3]'
            ]
          }
        ]
      })
    })

    it('correctly parses and solves an OR construction with two AND constructions and a NOT inside of it', async () => {
      let parsedFact = lawReg.factParser.parse('([fact1] EN [fact2]) OF ([fact3] EN (NIET [fact4]))')
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      const factResolver = (fact) => {
        return fact === '[fact1]' || fact === '[fact2]'
      }
      let result = await lawReg.checkExpression(parsedFact, ssid, { 'factResolver': factResolver })

      expect(result).to.equal(true)

      expect(parsedFact).to.deep.equal({
        'expression': 'OR',
        'operands': [
          {
            'expression': 'AND',
            'operands': [
              '[fact1]',
              '[fact2]'
            ]
          },
          {
            'expression': 'AND',
            'operands': [
              '[fact3]',
              {
                'expression': 'NOT',
                'operand': '[fact4]'
              }
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

      let actsLink = modelReference.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']
      let factsLink = modelReference.data['DISCIPL_FLINT_MODEL'].facts[2]['[betrokkene]']
      let dutiesLink = modelReference.data['DISCIPL_FLINT_MODEL'].duties[0]['<verwelkomen binnen 14 dagen na aanvragen>']

      let actDetails = await lawReg.getActDetails(actsLink, ssid)
      let factReference = await core.get(factsLink, ssid)
      let dutyReference = await core.get(dutiesLink, ssid)

      expect(Object.keys(modelReference.data['DISCIPL_FLINT_MODEL'])).to.have.members(['model', 'acts', 'facts', 'duties'])

      expect(actDetails).to.deep.equal(
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
            'preconditions': '[]',
            'create': '<verwelkomen>',
            'terminate': '',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }],
        'facts': [
          { 'fact': '[ingezetene]', 'function': '[]', 'reference': '' }
        ],
        'duties': []
      }

      let lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      let needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)

      let actorSsid = await core.newSsid('ephemeral')

      let modelLink = await lawReg.publish(lawmakerSsid, model, {
        '[ingezetene]':
          'IS:' + actorSsid.did
      })

      let retrievedModel = await core.get(modelLink)

      let needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      let factResolver = (fact) => true

      let actionLink = await lawReg.take(actorSsid, needLink, '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolver)

      let action = await core.get(actionLink, actorSsid)

      expect(action).to.deep.equal({
        'data': {
          'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
          'DISCIPL_FLINT_GLOBAL_CASE': needLink,
          'DISCIPL_FLINT_PREVIOUS_CASE': needLink
        },
        'previous': null
      })
    })

    it('should be able to determine active duties', async () => {
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
            'preconditions': '[]',
            'create': '<verwelkomen>',
            'terminate': '',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          },
          {
            'act': '<<ingezetene geeft aan dat verwelkomen niet nodig is>>',
            'action': '[aangeven]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'interested-party': '[overheid]',
            'preconditions': '[]',
            'create': '',
            'terminate': '<verwelkomen>',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }],
        'facts': [
          { 'fact': '[ingezetene]', 'function': '[]', 'reference': 'art 1.1' },
          { 'fact': '[overheid]', 'function': '[]', 'reference': '' }
        ],
        'duties': [
          {
            'duty': '<verwelkomen>',
            'duty-components': '',
            'duty-holder': '[overheid]',
            'claimant': '[ingezetene]',
            'create': '<<ingezetene kan verwelkomst van overheid aanvragen>>>',
            'terminate': '<<ingezetene geeft aan dat verwelkomen niet nodig is>>',
            'version': '',
            'reference': '',
            'juriconnect': '',
            'sourcetext': '',
            'explanation': ''
          }
        ]
      }

      let lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      let needSsid = await core.newSsid('ephemeral')
      await core.allow(needSsid)

      let actorSsid = await core.newSsid('ephemeral')
      await core.allow(actorSsid)

      let overheidSsid = await core.newSsid('ephemeral')

      let modelLink = await lawReg.publish(lawmakerSsid, model, {
        '[ingezetene]':
          'IS:' + actorSsid.did,
        '[overheid]': 'IS:' + overheidSsid.did
      })

      let needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      let factResolver = (fact) => true

      let actionLink = await lawReg.take(actorSsid, needLink, '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolver)
      let activeDuties = (await lawReg.getActiveDuties(actionLink, actorSsid)).map(dutyInformation => dutyInformation.duty)
      let activeDuties2 = (await lawReg.getActiveDuties(actionLink, overheidSsid)).map(dutyInformation => dutyInformation.duty)
      expect(activeDuties).to.deep.equal([])
      expect(activeDuties2).to.deep.equal(['<verwelkomen>'])
    })

    it('should be able to determine active duties being terminated', async () => {
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
            'preconditions': '[]',
            'create': '<verwelkomen>',
            'terminate': '',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          },
          {
            'act': '<<ingezetene geeft aan dat verwelkomen niet nodig is>>',
            'action': '[aangeven]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'interested-party': '[overheid]',
            'preconditions': '[]',
            'create': '',
            'terminate': '<verwelkomen>',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }],
        'facts': [
          { 'fact': '[ingezetene]', 'function': '[]', 'reference': 'art 1.1' },
          { 'fact': '[overheid]', 'function': '[]', 'reference': '' }
        ],
        'duties': [
          {
            'duty': '<verwelkomen>',
            'duty-components': '',
            'duty-holder': '[overheid]',
            'claimant': '[ingezetene]',
            'create': '<<ingezetene kan verwelkomst van overheid aanvragen>>>',
            'terminate': '<<ingezetene geeft aan dat verwelkomen niet nodig is>>',
            'version': '',
            'reference': '',
            'juriconnect': '',
            'sourcetext': '',
            'explanation': ''
          }
        ]
      }

      let lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      let needSsid = await core.newSsid('ephemeral')
      await core.allow(needSsid)

      let actorSsid = await core.newSsid('ephemeral')
      await core.allow(actorSsid)

      let overheidSsid = await core.newSsid('ephemeral')

      let modelLink = await lawReg.publish(lawmakerSsid, model, {
        '[ingezetene]':
          'IS:' + actorSsid.did,
        '[overheid]': 'IS:' + overheidSsid.did
      })

      let needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      let factResolver = (fact) => true

      let actionLink = await lawReg.take(actorSsid, needLink, '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolver)
      let actionLink2 = await lawReg.take(actorSsid, actionLink, '<<ingezetene geeft aan dat verwelkomen niet nodig is>>', factResolver)
      let activeDuties = (await lawReg.getActiveDuties(actionLink2, actorSsid)).map(dutyInformation => dutyInformation.duty)
      let activeDuties2 = (await lawReg.getActiveDuties(actionLink2, overheidSsid)).map(dutyInformation => dutyInformation.duty)
      expect(activeDuties).to.deep.equal([])
      expect(activeDuties2).to.deep.equal([])
    })

    it('should be able to take an action dependent on recursive facts', async () => {
      let core = lawReg.getAbundanceService().getCoreAPI()

      let lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)

      let actorSsid = await core.newSsid('ephemeral')

      let modelLink = await lawReg.publish(lawmakerSsid, { ...awb, 'model': 'AWB' }, {
        '[persoon wiens belang rechtstreeks bij een besluit is betrokken]':
          'IS:' + actorSsid.did
      })

      let retrievedModel = await core.get(modelLink)

      let needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)
      let needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<indienen verzoek een besluit te nemen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      let factResolver = (fact) => {
        if (typeof fact === 'string') {
          return fact === '[verzoek een besluit te nemen]' ||
            fact === '[wetgevende macht]'
        }
        return false
      }

      let actionLink = await lawReg.take(actorSsid, needLink, '<<indienen verzoek een besluit te nemen>>', factResolver)

      let action = await core.get(actionLink, actorSsid)

      expect(action).to.deep.equal({
        'data': {
          'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
          'DISCIPL_FLINT_GLOBAL_CASE': needLink,
          'DISCIPL_FLINT_PREVIOUS_CASE': needLink
        },
        'previous': null
      })
    })

    it('should be able to take an action where the object originates from another action - AWB', async () => {
      let core = lawReg.getAbundanceService().getCoreAPI()

      let lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)

      let belanghebbendeSsid = await core.newSsid('ephemeral')
      await core.allow(belanghebbendeSsid)
      let bestuursorgaanSsid = await core.newSsid('ephemeral')
      await core.allow(bestuursorgaanSsid)

      let modelLink = await lawReg.publish(lawmakerSsid, { ...awb, 'model': 'AWB' }, {
        '[persoon wiens belang rechtstreeks bij een besluit is betrokken]':
          'IS:' + belanghebbendeSsid.did,
        '[wetgevende macht]':
          'IS:' + bestuursorgaanSsid.did
      })

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

      let actionLink = await lawReg.take(belanghebbendeSsid, needLink, '<<indienen verzoek een besluit te nemen>>', belanghebbendeFactresolver)

      let bestuursorgaanFactresolver = (fact) => {
        if (typeof fact === 'string') {
          // interested party
          return fact === '[persoon wiens belang rechtstreeks bij een besluit is betrokken]' ||
            // preconditions
            fact === '[aanvraag is geheel of gedeeltelijk geweigerd op grond van artikel 2:15 Awb]'
        }
        return false
      }

      let secondActionLink = await lawReg.take(bestuursorgaanSsid, actionLink, '<<besluiten de aanvraag niet te behandelen>>', bestuursorgaanFactresolver)

      expect(secondActionLink).to.be.a('string')

      let action = await core.get(secondActionLink, bestuursorgaanSsid)

      const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
        .filter(item => Object.keys(item).includes('<<besluiten de aanvraag niet te behandelen>>'))

      expect(action.data).to.deep.equal({
        'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
        'DISCIPL_FLINT_GLOBAL_CASE': needLink,
        'DISCIPL_FLINT_PREVIOUS_CASE': actionLink
      })
    })

    it('should be able to fill functions of single and multiple facts', async () => {
      let core = lawReg.getAbundanceService().getCoreAPI()
      let ssid = await core.newSsid('ephemeral')

      let model = {
        'acts': [],
        'facts': [
          {
            'explanation': '',
            'fact': '[belanghebbende]',
            'function': '[persoon wiens belang rechtstreeks bij een besluit is betrokken]',
            'reference': 'art. 1:2 lid 1 Awb',
            'version': '2-[19940101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:2&lid=1&z=2017-03-10&g=2017-03-10',
            'sourcetext': '{Onder belanghebbende wordt verstaan: degene wiens belang rechtstreeks bij een besluit is betrokken}'
          },
          {
            'explanation': '',
            'fact': '[toezending besluit aan aanvrager]',
            'function': '[]',
            'reference': 'art 3:41 lid 1 Awb',
            'version': '',
            'juriconnect': '',
            'sourcetext': ''
          },
          {
            'explanation': '',
            'fact': '[toezending besluit aan meer belanghebbenden]',
            'function': '[]',
            'reference': 'art 3:41 lid 1 Awb',
            'version': '',
            'juriconnect': '',
            'sourcetext': ''
          },
          {
            'explanation': '',
            'fact': '[uitreiking besluit aan aanvrager]',
            'function': '[]',
            'reference': 'art 3:41 lid 1 Awb',
            'version': '',
            'juriconnect': '',
            'sourcetext': ''
          },
          {
            'explanation': '',
            'fact': '[uitreiking besluit aan meer belanghebbenden]',
            'function': '[]',
            'reference': 'art 3:41 lid 1 Awb',
            'version': '',
            'juriconnect': '',
            'sourcetext': ''
          }
        ],
        'duties': []
      }

      let modelLink = await lawReg.publish(ssid, { ...model, 'model': 'AWB' }, {
        '[uitreiking besluit aan aanvrager]':
          'IS:did:discipl:ephemeral:1234',
        '[toezending besluit aan aanvrager]':
          'IS:did:discipl:ephemeral:1234'
      })

      let retrievedModel = await core.get(modelLink, ssid)

      let retrievedFact = await core.get(retrievedModel.data['DISCIPL_FLINT_MODEL'].facts[3]['[uitreiking besluit aan aanvrager]'], ssid)

      retrievedFact = retrievedFact.data['DISCIPL_FLINT_FACT'].function
      expect(retrievedFact).to.deep.equal('IS:did:discipl:ephemeral:1234')

      let retrievedSecondFact = await core.get(retrievedModel.data['DISCIPL_FLINT_MODEL'].facts[1]['[toezending besluit aan aanvrager]'], ssid)
      retrievedSecondFact = retrievedSecondFact.data['DISCIPL_FLINT_FACT'].function
      expect(retrievedSecondFact).to.deep.equal('IS:did:discipl:ephemeral:1234')
    })

    const checkActionModel = {
      'acts': [{
        'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
        'action': '[aanvragen]',
        'actor': '[aanvrager]',
        'object': '[verwelkomst]',
        'interested-party': '[overheid]',
        'preconditions': '[]',
        'create': '<verwelkomen>',
        'terminate': '',
        'reference': 'art 2.1',
        'sourcetext': '',
        'explanation': '',
        'version': '2-[19980101]-[jjjjmmdd]',
        'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
      }],
      'facts': [{
        'explanation': '',
        'fact': '[belanghebbende]',
        'function': '[persoon wiens belang rechtstreeks bij een besluit is betrokken]',
        'reference': 'art. 1:2 lid 1 Awb',
        'version': '2-[19940101]-[jjjjmmdd]',
        'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:2&lid=1&z=2017-03-10&g=2017-03-10',
        'sourcetext': '{Onder belanghebbende wordt verstaan: degene wiens belang rechtstreeks bij een besluit is betrokken}'
      }, {
        'explanation': '',
        'fact': '[aanvrager]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }, {
        'explanation': '',
        'fact': '[toezending besluit aan aanvrager]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }, {
        'explanation': '',
        'fact': '[toezending besluit aan meer belanghebbenden]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }, {
        'explanation': '',
        'fact': '[uitreiking besluit aan aanvrager]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }, {
        'explanation': '',
        'fact': '[uitreiking besluit aan meer belanghebbenden]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }],
      'duties': []
    }

    it('should perform a checkAction', async () => {
      let core = lawReg.getAbundanceService().getCoreAPI()

      let model = checkActionModel

      let ssid = await core.newSsid('ephemeral')
      let modelLink = await lawReg.publish(ssid, model, {
        '[aanvrager]':
          'IS:' + ssid.did
      })
      let modelRef = await core.get(modelLink, ssid)

      let actsLink = modelRef.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']

      const factResolver = (fact) => {
        return true
      }

      let result = await lawReg.checkAction(modelLink, actsLink, ssid, { 'factResolver': factResolver })

      expect(result).to.deep.equal({
        'invalidReasons': [
        ],
        'valid': true
      })
    })

    it('should perform a checkAction with false result', async () => {
      let core = lawReg.getAbundanceService().getCoreAPI()

      let model = checkActionModel

      let ssid = await core.newSsid('ephemeral')
      let modelLink = await lawReg.publish(ssid, model, {
        '[aanvrager]':
          'IS:' + ssid.did
      })
      let modelRef = await core.get(modelLink, ssid)

      let actsLink = modelRef.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']

      const factResolver = (fact) => {
        return false
      }

      let result = await lawReg.checkAction(modelLink, actsLink, ssid, { 'factResolver': factResolver })

      expect(result).to.deep.equal({
        'invalidReasons': [
          'object',
          'interested-party',
          'preconditions'
        ],
        'valid': false
      })
    })

    it('should short-circuit a checkAction if needed', async () => {
      let core = lawReg.getAbundanceService().getCoreAPI()

      let model = checkActionModel

      let ssid = await core.newSsid('ephemeral')
      let modelLink = await lawReg.publish(ssid, model, {
        '[aanvrager]':
          'IS:' + ssid.did
      })
      let modelRef = await core.get(modelLink, ssid)

      let actsLink = modelRef.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']

      const factResolver = sinon.stub()

      factResolver.returns(false)

      let result = await lawReg.checkAction(modelLink, actsLink, ssid, { 'factResolver': factResolver }, true)

      expect(result).to.deep.equal({
        'invalidReasons': [
          'object'
        ],
        'valid': false
      })

      expect(factResolver.callCount).to.equal(1)
      expect(factResolver.args[0]).to.deep.equal(['[verwelkomst]', 'object'])
    })
  })
})
