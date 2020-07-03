/* eslint-env mocha */
import { expect } from 'chai'

import sinon from 'sinon'
import { LawReg } from '../src/index.js'
import * as log from 'loglevel'
import Util from '../src/util'

import awb from './flint-example-awb'

// Adjusting log level for debugging can be done here, or in specific tests that need more finegrained logging during development
log.getLogger('disciplLawReg').setLevel('debug')

const lawReg = new LawReg()

describe('discipl-law-reg', () => {
  describe('The discipl-law-reg library', () => {
    it('should publish small example', async () => {
      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'recipient': '[overheid]',
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
            'recipient': '[overheid]',
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
            'recipient': '[overheid]',
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

      const abundancesvc = lawReg.getAbundanceService()
      const core = abundancesvc.getCoreAPI()

      const ssid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(ssid, model)

      const modelReference = await core.get(modelLink, ssid)

      const actsLink = modelReference.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']
      const factsLink = modelReference.data['DISCIPL_FLINT_MODEL'].facts[2]['[betrokkene]']
      const dutiesLink = modelReference.data['DISCIPL_FLINT_MODEL'].duties[0]['<verwelkomen binnen 14 dagen na aanvragen>']

      const actDetails = await lawReg.getActDetails(actsLink, ssid)
      const factReference = await core.get(factsLink, ssid)
      const dutyReference = await core.get(dutiesLink, ssid)

      expect(Object.keys(modelReference.data['DISCIPL_FLINT_MODEL'])).to.have.members(['model', 'acts', 'facts', 'duties'])

      expect(actDetails).to.deep.equal(
        {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'action': '[aanvragen]',
          'actor': '[ingezetene]',
          'object': '[verwelkomst]',
          'recipient': '[overheid]',
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
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'recipient': '[overheid]',
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
      const util = new Util(lawReg)
      const { ssids, modelLink } = await util.setupModel(model, ['ingezetene'], { '[ingezetene]': 'ingezetene' }, false)

      const needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)

      const retrievedModel = await core.get(modelLink)

      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = (fact) => true

      const actionLink = await lawReg.take(ssids['ingezetene'], needLink, '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolver)

      const action = await core.get(actionLink, ssids['ingezetene'])

      expect(action.data).to.deep.equal({
        'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
        'DISCIPL_FLINT_FACTS_SUPPLIED': {
          '[overheid]': true,
          '[verwelkomst]': true
        },
        'DISCIPL_FLINT_GLOBAL_CASE': needLink,
        'DISCIPL_FLINT_PREVIOUS_CASE': needLink
      })
    })

    it('should be able to take an action with an async factresolver', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'recipient': '[overheid]',
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

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      const needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)

      const actorSsid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(lawmakerSsid, model, {
        '[ingezetene]':
          'IS:' + actorSsid.did
      })

      const retrievedModel = await core.get(modelLink)

      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = async (fact) => true

      const actionLink = await lawReg.take(actorSsid, needLink, '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolver)

      const action = await core.get(actionLink, actorSsid)

      expect(action).to.deep.equal({
        'data': {
          'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
          'DISCIPL_FLINT_FACTS_SUPPLIED': {
            '[overheid]': true,
            '[verwelkomst]': true
          },
          'DISCIPL_FLINT_GLOBAL_CASE': needLink,
          'DISCIPL_FLINT_PREVIOUS_CASE': needLink
        },
        'previous': null
      })
    })

    it('should be able to take an action with a list', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve kinderbijslag',
        'acts': [
          {
            'act': '<<kinderbijslag aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ouder]',
            'object': '[verzoek]',
            'recipient': '[overheid]',
            'preconditions': {
              'expression': 'LIST',
              'name': 'leeftijden',
              'items': '[leeftijd]'
            },
            'create': [],
            'terminate': [],
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

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      const needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)

      const actorSsid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(lawmakerSsid, model, {})

      const retrievedModel = await core.get(modelLink)

      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<kinderbijslag aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = (fact, listNames, listIndices) => {
        if (listNames && listNames[0] === 'leeftijden') {
          if (listIndices[0] === 0) {
            return 8
          } else if (listIndices[0] === 1) {
            return 12
          } else {
            return false
          }
        }

        return true
      }

      const actionLink = await lawReg.take(actorSsid, needLink, '<<kinderbijslag aanvragen>>', factResolver)

      const action = await core.get(actionLink, actorSsid)

      expect(action).to.deep.equal({
        'data': {
          'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
          'DISCIPL_FLINT_FACTS_SUPPLIED': {
            '[ouder]': true,
            '[overheid]': true,
            '[verzoek]': true,
            'leeftijden': [
              {
                '[leeftijd]': 8
              },
              {
                '[leeftijd]': 12
              },
              {
                '[leeftijd]': false
              }
            ]
          },
          'DISCIPL_FLINT_GLOBAL_CASE': needLink,
          'DISCIPL_FLINT_PREVIOUS_CASE': needLink
        },
        'previous': null
      })
    })

    it('should be able to take an action with a nested list', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve kinderbijslag',
        'acts': [
          {
            'act': '<<kinderbijslag aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ouder]',
            'object': '[verzoek]',
            'recipient': '[overheid]',
            'preconditions': {
              'expression': 'LIST',
              'name': 'kinderen',
              'items': {
                'expression': 'LIST',
                'name': 'diplomas',
                'items': '[diploma]'
              }
            },
            'create': [],
            'terminate': [],
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

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      const needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)

      const actorSsid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(lawmakerSsid, model, {})

      const retrievedModel = await core.get(modelLink)

      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<kinderbijslag aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = (fact, listNames, listIndices) => {
        if (listNames && listNames[0] === 'kinderen') {
          if (listIndices[0] === 0 && listIndices[1] === 0) {
            return 'BSc Technische Wiskunde'
          } else if (listIndices[0] === 1 && listIndices[1] === 0) {
            return 'MSc Applied Mathematics'
          } else {
            return false
          }
        }

        return true
      }

      const actionLink = await lawReg.take(actorSsid, needLink, '<<kinderbijslag aanvragen>>', factResolver)

      const action = await core.get(actionLink, actorSsid)

      expect(action).to.deep.equal({
        'data': {
          'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
          'DISCIPL_FLINT_FACTS_SUPPLIED': {
            '[ouder]': true,
            '[overheid]': true,
            '[verzoek]': true,
            'kinderen': [
              {
                'diplomas': [
                  {
                    '[diploma]': 'BSc Technische Wiskunde'
                  },
                  {
                    '[diploma]': false
                  }
                ]
              },
              {
                'diplomas': [
                  {
                    '[diploma]': 'MSc Applied Mathematics'
                  },
                  {
                    '[diploma]': false
                  }
                ]
              },
              {
                'diplomas': [
                  {
                    '[diploma]': false
                  }
                ]
              }
            ]
          },
          'DISCIPL_FLINT_GLOBAL_CASE': needLink,
          'DISCIPL_FLINT_PREVIOUS_CASE': needLink
        },
        'previous': null
      })
    })

    it('should be able to determine active duties', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'recipient': '[overheid]',
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
            'recipient': '[overheid]',
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

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      const needSsid = await core.newSsid('ephemeral')
      await core.allow(needSsid)

      const actorSsid = await core.newSsid('ephemeral')
      await core.allow(actorSsid)

      const overheidSsid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(lawmakerSsid, model, {
        '[ingezetene]':
          'IS:' + actorSsid.did,
        '[overheid]': 'IS:' + overheidSsid.did
      })

      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = (fact) => true

      const actionLink = await lawReg.take(actorSsid, needLink, '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolver)
      const activeDuties = (await lawReg.getActiveDuties(actionLink, actorSsid)).map(dutyInformation => dutyInformation.duty)
      const activeDuties2 = (await lawReg.getActiveDuties(actionLink, overheidSsid)).map(dutyInformation => dutyInformation.duty)
      expect(activeDuties).to.deep.equal([])
      expect(activeDuties2).to.deep.equal(['<verwelkomen>'])
    })

    const testMathExpression = async (precondition, facts) => {
      const model = {
        'acts': [
          {
            'act': '<<compute mathematical expression>>',
            'actor': '[mathematician]',
            'object': '[expression]',
            'recipient': '[user]',
            'preconditions': precondition
          }
        ],
        'facts': [],
        'duties': []
      }

      const completeFacts = { '[expression]': true, '[user]': true, '[mathematician]': true, ...facts }
      const util = new Util(lawReg)

      const { ssids, modelLink } = await util.setupModel(model, ['mathematician'], { 'mathematician': '[mathematician]' })

      await util.scenarioTest(ssids, modelLink, [{ 'act': '<<compute mathematical expression>>', 'actor': 'mathematician' }], completeFacts)
    }

    const testFalseMathExpression = async (precondition, facts) => {
      let errorMessage = ''
      try {
        await testMathExpression(precondition, facts)
      } catch (e) {
        errorMessage = e.message
      }
      expect(errorMessage).to.equal('Action <<compute mathematical expression>> is not allowed')
    }

    it('should be able to compare numbers', async () => {
      await testMathExpression({
        'expression': 'LESS_THAN',
        'operands': [
          '[three]',
          '[five]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5
      })
    })

    it('should be able to compare literals', async () => {
      await testMathExpression({
        'expression': 'LESS_THAN',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 3
          },
          {
            'expression': 'LITERAL',
            'operand': 5
          }
        ]
      },
      {})
    })

    it('should be able to compare numbers with a false result', async () => {
      await testFalseMathExpression({
        'expression': 'LESS_THAN',
        'operands': [
          '[five]',
          '[three]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5
      })
    })

    it('should be able to compare numbers equality with a false result', async () => {
      await testFalseMathExpression({
        'expression': 'EQUAL',
        'operands': [
          '[dozen]',
          '[thirteen]'
        ]
      },
      {
        '[dozen]': 12,
        '[thirteen]': 13
      })
    })

    it('should be able to add numbers', async () => {
      await testMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'SUM',
            'operands': [
              '[three]', '[five]'
            ]
          },
          '[eight]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5,
        '[eight]': 8
      })
    })

    it('should be able to add in a list', async () => {
      await testMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'SUM',
            'operands': [
              {
                'expression': 'LIST',
                'items': '[number]'
              }
            ]
          },
          '[eight]'
        ]
      },
      {
        '[number]': [3, 5, false],
        '[eight]': 8
      })
    })

    it('should be able to add numbers with a false result', async () => {
      await testFalseMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'SUM',
            'operands': [
              '[three]', '[five]'
            ]
          },
          '[nine]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5,
        '[nine]': 9
      })
    })

    it('should be able to determine the minimum of numbers', async () => {
      await testMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'MIN',
            'operands': [
              '[three]', '[five]'
            ]
          },
          '[three]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5
      })
    })

    it('should be able to evaluate a literal boolean', async () => {
      await testMathExpression({
        'expression': 'LITERAL',
        'operand': true
      },
      {
      })
    })

    it('should be able to determine the minimum of numbers', async () => {
      await testMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'MIN',
            'operands': [
              '[three]', '[five]'
            ]
          },
          '[three]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5
      })
    })

    it('should be able to multiply in a list', async () => {
      await testMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'PRODUCT',
            'operands': [
              {
                'expression': 'LIST',
                'items': '[number]'
              }
            ]
          },
          '[fifteen]'
        ]
      },
      {
        '[number]': [3, 5, false],
        '[fifteen]': 15
      })
    })

    it('should be able to multiply numbers with arbitrary precision', async () => {
      await testMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'PRODUCT',
            'operands': [
              {
                'expression': 'LITERAL',
                'operand': 1.15
              }, '[400]', '[100]'
            ]
          },
          '[46000]'
        ]
      },
      {
        '[400]': 400,
        '[100]': 100,
        '[46000]': 46000
      })
    })

    it('should be able to multiply numbers with a false result', async () => {
      await testFalseMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'PRODUCT',
            'operands': [
              '[three]', '[five]'
            ]
          },
          '[fourteen]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5,
        '[fourteen]': 14
      })
    })

    it('should be able to determine the maximum of numbers', async () => {
      await testMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'MAX',
            'operands': [
              '[three]', '[five]'
            ]
          },
          '[five]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5
      })
    })

    it('should be able to determine the minimum of numbers', async () => {
      await testMathExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'MIN',
            'operands': [
              '[three]', '[five]'
            ]
          },
          '[three]'
        ]
      },
      {
        '[three]': 3,
        '[five]': 5
      })
    })

    it('should throw an error with unknown expressions', async () => {
      let errorMessage
      try {
        await testMathExpression({
          'expression': 'BANANAS',
          'operands': [
            '[three]', '[five]'
          ]
        },
        {
          '[three]': 3,
          '[five]': 5
        })
      } catch (e) {
        errorMessage = e.message
      }

      expect(errorMessage).to.equal('Unknown expression type BANANAS')
    })

    it('should be able to determine active duties being terminated', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[verwelkomst]',
            'recipient': '[overheid]',
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
            'recipient': '[overheid]',
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

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      const needSsid = await core.newSsid('ephemeral')
      await core.allow(needSsid)

      const actorSsid = await core.newSsid('ephemeral')
      await core.allow(actorSsid)

      const overheidSsid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(lawmakerSsid, model, {
        '[ingezetene]':
          'IS:' + actorSsid.did,
        '[overheid]': 'IS:' + overheidSsid.did
      })

      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = (fact) => true

      const actionLink = await lawReg.take(actorSsid, needLink, '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolver)
      const actionLink2 = await lawReg.take(actorSsid, actionLink, '<<ingezetene geeft aan dat verwelkomen niet nodig is>>', factResolver)
      const activeDuties = (await lawReg.getActiveDuties(actionLink2, actorSsid)).map(dutyInformation => dutyInformation.duty)
      const activeDuties2 = (await lawReg.getActiveDuties(actionLink2, overheidSsid)).map(dutyInformation => dutyInformation.duty)
      expect(activeDuties).to.deep.equal([])
      expect(activeDuties2).to.deep.equal([])
    })

    it('should be able to determine available acts', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[aanvraag verwelkomst]',
            'recipient': '[overheid]',
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
          { 'fact': '[ingezetene]', 'function': '[]', 'reference': 'art 1.1' },
          { 'fact': '[overheid]', 'function': '[]', 'reference': '' },
          { 'fact': '[verwelkomst]', 'function': { 'expression': 'CREATE', 'operands': [] }, 'reference': '' }
        ],
        'duties': [
        ]
      }

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      const needSsid = await core.newSsid('ephemeral')
      await core.allow(needSsid)

      const ingezeteneSsid = await core.newSsid('ephemeral')
      await core.allow(ingezeteneSsid)

      const overheidSsid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(lawmakerSsid, model, {
        '[ingezetene]':
          'IS:' + ingezeteneSsid.did,
        '[overheid]': 'IS:' + overheidSsid.did
      })

      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const possibleActs = await lawReg.getAvailableActs(needLink, ingezeteneSsid, [], [])
      expect(possibleActs).to.deep.equal([])

      const possibleActs2 = (await lawReg.getAvailableActs(needLink, ingezeteneSsid, ['[aanvraag verwelkomst]'], [])).map((actInfo) => actInfo.act)
      expect(possibleActs2).to.deep.equal(['<<ingezetene kan verwelkomst van overheid aanvragen>>'])
    })

    it('should be able to determine possible actions with a list', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()
      const util = new Util(lawReg)
      const { ssids, modelLink } = await util.setupModel({
        'model': 'Fictieve kinderbijslag',
        'acts': [
          {
            'act': '<<kinderbijslag aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ouder]',
            'object': '[verzoek]',
            'recipient': '[overheid]',
            'preconditions': {
              'expression': 'LIST',
              'name': 'leeftijden',
              'items': '[leeftijd]'
            },
            'create': [],
            'terminate': [],
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
      }, ['actor'], {})

      const needLink = await core.claim(ssids['actor'], {
        'need': {
          'act': '<<kinderbijslag aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const possibleActs = (await lawReg.getAvailableActs(needLink, ssids['actor'], [], [])).map((actInfo) => actInfo.act)

      expect(possibleActs).to.deep.equal([])

      const potentialActs = (await lawReg.getPotentialActs(needLink, ssids['actor'], [], [])).map((actInfo) => actInfo.act)

      expect(potentialActs).to.deep.equal(['<<kinderbijslag aanvragen>>'])
    })

    it('should be able to determine possible actions with a less than', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()
      const util = new Util(lawReg)
      const { ssids, modelLink } = await util.setupModel({
        'model': 'Fictieve kinderbijslag',
        'acts': [
          {
            'act': '<<kinderbijslag aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ouder]',
            'object': '[verzoek]',
            'recipient': '[overheid]',
            'preconditions': {
              'expression': 'LESS_THAN',
              'operands': [
                '[kinderen]',
                '[honderd]'
              ]
            },
            'create': [],
            'terminate': [],
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }],
        'facts': [
        ],
        'duties': []
      }, ['actor'], {})

      const needLink = await core.claim(ssids['actor'], {
        'need': {
          'act': '<<kinderbijslag aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const possibleActs = (await lawReg.getAvailableActs(needLink, ssids['actor'], [], [])).map((actInfo) => actInfo.act)

      expect(possibleActs).to.deep.equal([])

      const potentialActs = (await lawReg.getPotentialActs(needLink, ssids['actor'], [], [])).map((actInfo) => actInfo.act)

      expect(potentialActs).to.deep.equal(['<<kinderbijslag aanvragen>>'])
    })

    it('should be able to determine possible actions with multiple options for created facts', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()
      const util = new Util(lawReg)
      const { ssids, modelLink } = await util.setupModel({
        'model': 'Fictieve kinderbijslag',
        'acts': [
          {
            'act': '<<kinderbijslag aanvragen>>',
            'actor': '[ouder]',
            'object': '[verzoek]',
            'recipient': '[Minister]',
            'preconditions': {
              'expression': 'LITERAL',
              'operand': true
            },
            'create': ['[aanvraag]']
          },
          {
            'act': '<<aanvraag kinderbijslag toekennen>>',
            'actor': '[Minister]',
            'object': '[aanvraag]',
            'recipient': '[ouder]',
            'preconditions': {
              'expression': 'LITERAL',
              'operand': true
            }
          }
        ],
        'facts': [
          {
            'fact': '[aanvraag]',
            'function': {
              'expression': 'CREATE',
              'operands': []
            }
          }
        ],
        'duties': []
      }, ['actor'], {})

      const needLink = await core.claim(ssids['actor'], {
        'need': {
          'act': '<<kinderbijslag aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const actionLink = await lawReg.take(ssids['actor'], needLink, '<<kinderbijslag aanvragen>>', () => true)
      const actionLink2 = await lawReg.take(ssids['actor'], actionLink, '<<kinderbijslag aanvragen>>', () => true)
      const possibleActs = (await lawReg.getAvailableActs(actionLink2, ssids['actor'], [], [])).map((actInfo) => actInfo.act)

      expect(possibleActs).to.deep.equal([])

      const potentialActs = (await lawReg.getPotentialActs(actionLink2, ssids['actor'], [], [])).map((actInfo) => actInfo.act)

      expect(potentialActs).to.deep.equal(['<<kinderbijslag aanvragen>>', '<<aanvraag kinderbijslag toekennen>>'])
    })

    it('should not show an act as available when only a not prevents it', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = {
        'model': 'Fictieve verwelkomingsregeling Staat der Nederlanden',
        'acts': [
          {
            'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            'action': '[aanvragen]',
            'actor': '[ingezetene]',
            'object': '[aanvraag verwelkomst]',
            'recipient': '[overheid]',
            'preconditions': 'NIET [langer dan een jaar geleden gearriveerd]',
            'create': '<verwelkomen>',
            'terminate': '',
            'reference': 'art 2.1',
            'sourcetext': '',
            'explanation': '',
            'version': '2-[19980101]-[jjjjmmdd]',
            'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
          }],
        'facts': [
          { 'fact': '[ingezetene]', 'function': '[]', 'reference': 'art 1.1' },
          { 'fact': '[overheid]', 'function': '[]', 'reference': '' },
          { 'fact': '[verwelkomst]', 'function': { 'expression': 'CREATE', 'operands': [] }, 'reference': '' }
        ],
        'duties': [
        ]
      }

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)
      const needSsid = await core.newSsid('ephemeral')
      await core.allow(needSsid)

      const actorSsid = await core.newSsid('ephemeral')
      await core.allow(actorSsid)

      const overheidSsid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(lawmakerSsid, model, {
        '[ingezetene]':
          'IS:' + actorSsid.did,
        '[overheid]': 'IS:' + overheidSsid.did
      })

      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const possibleActs = await lawReg.getAvailableActs(needLink, actorSsid, [], [])
      expect(possibleActs).to.deep.equal([])

      const possibleActs2 = (await lawReg.getAvailableActs(needLink, actorSsid, ['[aanvraag verwelkomst]'], [])).map((actInfo) => actInfo.act)
      expect(possibleActs2).to.deep.equal([])
    })

    it('should be able to take an action dependent on recursive facts', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)

      const actorSsid = await core.newSsid('ephemeral')

      const modelLink = await lawReg.publish(lawmakerSsid, { ...awb, 'model': 'AWB' }, {
        '[persoon wiens belang rechtstreeks bij een besluit is betrokken]':
          'IS:' + actorSsid.did
      })

      const retrievedModel = await core.get(modelLink)

      const needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)
      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<indienen verzoek een besluit te nemen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = (fact) => {
        if (typeof fact === 'string') {
          return fact === '[verzoek een besluit te nemen]' ||
            fact === '[wetgevende macht]'
        }
        return false
      }

      const actionLink = await lawReg.take(actorSsid, needLink, '<<indienen verzoek een besluit te nemen>>', factResolver)

      const action = await core.get(actionLink, actorSsid)

      expect(action).to.deep.equal({
        'data': {
          'DISCIPL_FLINT_ACT_TAKEN': Object.values(retrievedModel.data['DISCIPL_FLINT_MODEL'].acts[0])[0],
          'DISCIPL_FLINT_FACTS_SUPPLIED': {
            '[bij wettelijk voorschrift is anders bepaald]': false,
            '[verzoek een besluit te nemen]': true,
            '[wetgevende macht]': true
          },
          'DISCIPL_FLINT_GLOBAL_CASE': needLink,
          'DISCIPL_FLINT_PREVIOUS_CASE': needLink
        },
        'previous': null
      })
    })

    it('should be able to take an action where the object originates from another action - AWB', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const lawmakerSsid = await core.newSsid('ephemeral')
      await core.allow(lawmakerSsid)

      const belanghebbendeSsid = await core.newSsid('ephemeral')
      await core.allow(belanghebbendeSsid)
      const bestuursorgaanSsid = await core.newSsid('ephemeral')
      await core.allow(bestuursorgaanSsid)

      const modelLink = await lawReg.publish(lawmakerSsid, { ...awb, 'model': 'AWB' }, {
        '[persoon wiens belang rechtstreeks bij een besluit is betrokken]':
          'IS:' + belanghebbendeSsid.did,
        '[wetgevende macht]':
          'IS:' + bestuursorgaanSsid.did
      })

      const retrievedModel = await core.get(modelLink)

      const needSsid = await core.newSsid('ephemeral')

      await core.allow(needSsid)
      const needLink = await core.claim(needSsid, {
        'need': {
          'act': '<<indienen verzoek een besluit te nemen>>',
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const belanghebbendeFactresolver = (fact) => {
        if (typeof fact === 'string') {
          return fact === '[verzoek een besluit te nemen]'
        }
        return false
      }

      const actionLink = await lawReg.take(belanghebbendeSsid, needLink, '<<indienen verzoek een besluit te nemen>>', belanghebbendeFactresolver)

      const bestuursorgaanFactresolver = (fact) => {
        if (typeof fact === 'string') {
          // interested party
          return fact === '[persoon wiens belang rechtstreeks bij een besluit is betrokken]' ||
            // preconditions
            fact === '[aanvraag is geheel of gedeeltelijk geweigerd op grond van artikel 2:15 Awb]'
        }
        return false
      }

      const secondActionLink = await lawReg.take(bestuursorgaanSsid, actionLink, '<<besluiten de aanvraag niet te behandelen>>', bestuursorgaanFactresolver)

      expect(secondActionLink).to.be.a('string')

      const action = await core.get(secondActionLink, bestuursorgaanSsid)

      const expectedActLink = retrievedModel.data['DISCIPL_FLINT_MODEL'].acts
        .filter(item => Object.keys(item).includes('<<besluiten de aanvraag niet te behandelen>>'))

      expect(action.data).to.deep.equal({
        'DISCIPL_FLINT_ACT_TAKEN': Object.values(expectedActLink[0])[0],
        'DISCIPL_FLINT_FACTS_SUPPLIED': {
          '[aanvraag]': actionLink,
          '[aanvraag is geheel of gedeeltelijk geweigerd op grond van artikel 2:15 Awb]': true
        },
        'DISCIPL_FLINT_GLOBAL_CASE': needLink,
        'DISCIPL_FLINT_PREVIOUS_CASE': actionLink
      })
    })

    it('should be able to fill functions of single and multiple facts', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()
      const ssid = await core.newSsid('ephemeral')

      const model = {
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

      const modelLink = await lawReg.publish(ssid, { ...model, 'model': 'AWB' }, {
        '[uitreiking besluit aan aanvrager]':
          'IS:did:discipl:ephemeral:1234',
        '[toezending besluit aan aanvrager]':
          'IS:did:discipl:ephemeral:1234'
      })

      const retrievedModel = await core.get(modelLink, ssid)

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
        'recipient': '[overheid]',
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

    it('should be able to perform an action where the object originates from one of two other actions', async () => {
      const model = {
        'acts': [
          {
            'act': '<<bake cookie>>',
            'actor': '[baker]',
            'object': '[dough]',
            'recipient': '[bakery]',
            'preconditions': '[]',
            'create': ['[cookie]']
          },
          {
            'act': '<<eat cookie>>',
            'actor': '[baker]',
            'object': '[cookie]',
            'recipient': '[bakery]',
            'preconditions': '[]',
            'terminate': ['[cookie]']
          }
        ],
        'facts': [
          {
            'fact': '[cookie]',
            'function': {
              'expression': 'CREATE',
              'operands': []
            }
          }
        ],
        'duties': []
      }

      const util = new Util(lawReg)
      const core = lawReg.getAbundanceService().getCoreAPI()

      const { ssids, modelLink } = await util.setupModel(model, ['baker'], { 'baker': '[baker]' })

      const needLink = await core.claim(ssids['baker'], {
        'need': {
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = (fact, _listNames, _listIndices, creatingOptions) => {
        if (['[dough]', '[bakery]', '[baker]'].includes(fact)) {
          return true
        }
        console.log(fact)
        // Last option corresponds to first bake action because this array is populated backwards
        return creatingOptions[1]
      }

      const firstBakeAction = await lawReg.take(ssids['baker'], needLink, '<<bake cookie>>', factResolver)
      const secondBakeAction = await lawReg.take(ssids['baker'], firstBakeAction, '<<bake cookie>>', factResolver)
      const eatAction = await lawReg.take(ssids['baker'], secondBakeAction, '<<eat cookie>>', factResolver)

      const eatDetails = await core.get(eatAction, ssids['baker'])

      expect(eatDetails.data['DISCIPL_FLINT_FACTS_SUPPLIED']).to.deep.equal({
        '[baker]': true,
        '[bakery]': true,
        '[cookie]': firstBakeAction
      })

      const eatAction2 = await lawReg.take(ssids['baker'], eatAction, '<<eat cookie>>', factResolver)

      const eatDetails2 = await core.get(eatAction2, ssids['baker'])

      expect(eatDetails2.data['DISCIPL_FLINT_FACTS_SUPPLIED']).to.deep.equal({
        '[baker]': true,
        '[bakery]': true,
        '[cookie]': secondBakeAction
      })
    })

    it('should perform a checkAction', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = checkActionModel

      const ssid = await core.newSsid('ephemeral')
      const modelLink = await lawReg.publish(ssid, model, {
        '[aanvrager]':
          'IS:' + ssid.did
      })
      const modelRef = await core.get(modelLink, ssid)

      const actsLink = modelRef.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']

      const factResolver = (fact) => {
        return true
      }

      const result = await lawReg.checkAction(modelLink, actsLink, ssid, { 'factResolver': factResolver })

      expect(result).to.deep.equal({
        'invalidReasons': [
        ],
        'valid': true
      })
    })

    it('should perform a checkAction with async factResolver', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = checkActionModel

      const ssid = await core.newSsid('ephemeral')
      const modelLink = await lawReg.publish(ssid, model, {
        '[aanvrager]':
          'IS:' + ssid.did
      })
      const modelRef = await core.get(modelLink, ssid)

      const actsLink = modelRef.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']

      const factResolver = async (fact) => {
        return true
      }

      const result = await lawReg.checkAction(modelLink, actsLink, ssid, { 'factResolver': factResolver })

      expect(result).to.deep.equal({
        'invalidReasons': [
        ],
        'valid': true
      })
    })

    it('should perform a checkAction with false result', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = checkActionModel

      const ssid = await core.newSsid('ephemeral')
      const modelLink = await lawReg.publish(ssid, model, {
        '[aanvrager]':
          'IS:' + ssid.did
      })
      const modelRef = await core.get(modelLink, ssid)

      const actsLink = modelRef.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']

      const factResolver = (fact) => {
        return false
      }

      const result = await lawReg.checkAction(modelLink, actsLink, ssid, { 'factResolver': factResolver })

      expect(result).to.deep.equal({
        'invalidReasons': [
          'object',
          'recipient'
        ],
        'valid': false
      })
    })

    it('should short-circuit a checkAction if needed', async () => {
      const core = lawReg.getAbundanceService().getCoreAPI()

      const model = checkActionModel

      const ssid = await core.newSsid('ephemeral')
      const modelLink = await lawReg.publish(ssid, model, {
        '[aanvrager]':
          'IS:' + ssid.did
      })
      const modelRef = await core.get(modelLink, ssid)

      const actsLink = modelRef.data['DISCIPL_FLINT_MODEL'].acts[0]['<<ingezetene kan verwelkomst van overheid aanvragen>>']

      const factResolver = sinon.stub()

      factResolver.returns(false)

      const result = await lawReg.checkAction(modelLink, actsLink, ssid, { 'factResolver': factResolver }, true)

      expect(result).to.deep.equal({
        'invalidReasons': [
          'object'
        ],
        'valid': false
      })

      expect(factResolver.callCount).to.equal(1)
      expect(factResolver.args[0][0]).to.equal('[verwelkomst]')
    })

    const explainExpression = async (expression, factSpec, expectedResult) => {
      const model = {
        'acts': [
          {
            'act': '<<explain something>>',
            'actor': '[person]',
            'object': '[explanation]',
            'recipient': '[everyone]',
            'preconditions': '[expression]',
            'create': []
          }
        ],
        'facts': [
          {
            'fact': '[expression]',
            'function': expression
          },
          {
            'fact': '[person]',
            'function': '[]'
          }
        ],
        'duties': []
      }

      const util = new Util(lawReg)
      const core = lawReg.getAbundanceService().getCoreAPI()

      const { ssids, modelLink } = await util.setupModel(model, ['person'], { '[person]': 'person' })

      const needLink = await core.claim(ssids['person'], {
        'need': {
          'DISCIPL_FLINT_MODEL_LINK': modelLink
        }
      })

      const factResolver = (fact, _item, _listNames, _listIndices, creatingOptions) => {
        if (factSpec.hasOwnProperty(fact)) {
          return factSpec[fact]
        }

        if (['[everyone]', '[explanation]'].includes(fact)) {
          return true
        }
      }

      const explanation = await lawReg.explain(ssids['person'], needLink, '<<explain something>>', factResolver)

      const expressionExplanation = explanation.operandExplanations.filter(explanation => explanation.fact === '[expression]')[0]

      // console.log(JSON.stringify(expressionExplanation, null, 2))
      expect(expressionExplanation).to.deep.equal(expectedResult)
    }

    it('should be able to explain an expression', async () => {
      await explainExpression({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 'banana'
          },
          '[favourite meal]'
        ]
      },
      {
        '[favourite meal]': 'banana'
      },
      {
        'fact': '[expression]',
        'operandExplanations': [
          {
            'expression': 'EQUAL',
            'operandExplanations': [
              {
                'expression': 'LITERAL',
                'value': 'banana'
              },
              {
                'fact': '[favourite meal]',
                'operandExplanations': [
                  {
                    'value': 'banana'
                  }
                ],
                'value': 'banana'
              }
            ],
            'value': true
          }
        ],
        'value': true
      }
      )
    })

    it('should be able to explain a less-than expression', async () => {
      await explainExpression({
        'expression': 'LESS_THAN',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 5
          },
          {
            'expression': 'LITERAL',
            'operand': 6
          }
        ]
      },
      {
      },
      {
        'fact': '[expression]',
        'operandExplanations': [
          {
            'expression': 'LESS_THAN',
            'operandExplanations': [
              {
                'expression': 'LITERAL',
                'value': '5'
              },
              {
                'expression': 'LITERAL',
                'value': '6'
              }
            ],
            'value': true
          }
        ],
        'value': true
      }
      )
    })

    it('should be able to explain a min expression', async () => {
      await explainExpression({
        'expression': 'MIN',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 5
          },
          {
            'expression': 'LITERAL',
            'operand': 6
          }
        ]
      },
      {
      },
      {
        'fact': '[expression]',
        'operandExplanations': [
          {
            'expression': 'MIN',
            'operandExplanations': [
              {
                'expression': 'LITERAL',
                'value': '5'
              },
              {
                'expression': 'LITERAL',
                'value': '6'
              }
            ],
            'value': '5'
          }
        ],
        'value': '5'
      }
      )
    })
  })

  describe('CREATE expression', async function () {
    it('should take an action if the fact and operands are created', async () => {
      const model = {
        'acts': [
          {
            'act': '<<aanvraag kinderbijslag>>',
            'actor': '[ouder]',
            'recipient': '[minister]',
            'object': '[verzoek]',
            'create': [
              '[aanvraag]'
            ]
          },
          {
            'act': '<<bedrag vaststellen>>',
            'actor': '[ouder]',
            'recipient': '[ouder]',
            'object': '[bedrag]',
            'create': [
              '[bedrag]'
            ]
          },
          {
            'act': '<<aanvraag kinderbijslag toekennen>>',
            'actor': '[minister]',
            'object': '[aanvraag]',
            'recipient': '[ouder]'
          }
        ],
        'facts': [
          {
            'fact': '[aanvraag]',
            'function': {
              'expression': 'CREATE',
              'operands': [
                '[bedrag]'
              ]
            }
          }
        ],
        'duties': []
      }

      const completeFacts = { '[ouder]': true, '[minister]': true, '[verzoek]': true, '[bedrag]': 100 }
      const util = new Util(lawReg)

      const { ssids, modelLink } = await util.setupModel(model, ['ouder', 'minister'], { 'ouder': '[ouder]', 'minister': '[minister]' })
      const acts = [
        {
          'act': '<<bedrag vaststellen>>',
          'actor': 'ouder'
        },
        {
          'act': '<<aanvraag kinderbijslag>>',
          'actor': 'ouder'
        },
        {
          'act': '<<aanvraag kinderbijslag toekennen>>',
          'actor': 'minister'
        }
      ]

      let errorMessage = ''
      try {
        await util.scenarioTest(ssids, modelLink, acts, completeFacts)
      } catch (e) {
        errorMessage = e.message
      }

      expect(acts).to.deep.include({ 'act': '<<bedrag vaststellen>>', 'actor': 'ouder' })
      expect(model.acts[0]).to.deep.include({ 'create': ['[aanvraag]'] })
      expect(model.acts[1]).to.deep.include({ 'create': ['[bedrag]'] })
      expect(errorMessage).to.equal('')
    })

    it('should not take an action if the fact is supplied', async () => {
      const model = {
        'acts': [
          {
            'act': '<<aanvraag kinderbijslag toekennen>>',
            'actor': '[minister]',
            'object': '[aanvraag]',
            'recipient': '[ouder]'
          }
        ],
        'facts': [
          {
            'fact': '[aanvraag]',
            'function': {
              'expression': 'CREATE'
            }
          }
        ],
        'duties': []
      }

      const completeFacts = { '[ouder]': true, '[minister]': true }
      const util = new Util(lawReg)

      const { ssids, modelLink } = await util.setupModel(model, ['minister'], { 'minister': '[minister]' })
      const acts = [
        {
          'act': '<<aanvraag kinderbijslag toekennen>>',
          'actor': 'minister'
        }
      ]

      let errorMessage = ''
      try {
        await util.scenarioTest(ssids, modelLink, acts, completeFacts)
      } catch (e) {
        errorMessage = e.message
      }

      expect(model.acts[0]).to.not.deep.include({ 'create': ['[aanvraag]'] })
      expect(errorMessage).to.equal('Action <<aanvraag kinderbijslag toekennen>> is not allowed')
    })

    it('should not take an action if a fact given as operand is not given', async () => {
      const model = {
        'acts': [
          {
            'act': '<<bedrag vaststellen>>',
            'actor': '[ouder]',
            'recipient': '[ouder]',
            'object': '[bedrag]',
            'create': [
              '[bedrag]'
            ]
          },
          {
            'act': '<<aanvraag kinderbijslag>>',
            'actor': '[ouder]',
            'recipient': '[minister]',
            'object': '[verzoek]',
            'create': [
              '[aanvraag]'
            ]
          },
          {
            'act': '<<aanvraag kinderbijslag toekennen>>',
            'actor': '[minister]',
            'object': '[aanvraag]',
            'recipient': '[ouder]'
          }
        ],
        'facts': [
          {
            'fact': '[aanvraag]',
            'function': {
              'expression': 'CREATE',
              'operands': [
                '[bedrag]'
              ]
            }
          }
        ],
        'duties': []
      }

      const completeFacts = { '[ouder]': true, '[minister]': true, '[verzoek]': true }
      const util = new Util(lawReg)

      const { ssids, modelLink } = await util.setupModel(model, ['ouder', 'minister'], { 'ouder': '[ouder]', 'minister': '[minister]' })
      const acts = [
        {
          'act': '<<aanvraag kinderbijslag>>',
          'actor': 'ouder'
        },
        {
          'act': '<<aanvraag kinderbijslag toekennen>>',
          'actor': 'minister'
        }
      ]

      let errorMessage = ''
      try {
        await util.scenarioTest(ssids, modelLink, acts, completeFacts)
      } catch (e) {
        errorMessage = e.message
      }

      expect(Object.keys(completeFacts)).to.not.include('[bedrag]')
      expect(acts).to.not.deep.include({ 'act': '<<bedrag vaststellen>>', 'actor': 'ouder' })
      expect(errorMessage).to.equal('Action <<aanvraag kinderbijslag toekennen>> is not allowed')
    })

    it('should allow OR expressions', async () => {
      const model = {
        'acts': [
          {
            'act': '<<aanvragen kinderbijslag>>',
            'actor': '[ouder]',
            'recipient': '[ambtenaar]',
            'object': '[verzoek]',
            'preconditions': '[maximaal]',
            'create': [
              '[aanvraag]'
            ]
          },
          {
            'act': '<<aanvraag kinderbijslag toekennen>>',
            'actor': '[ambtenaar]',
            'object': '[aanvraag]',
            'recipient': '[ouder]'
          }
        ],
        'facts': [
          {
            'fact': '[aanvraag]',
            'function': {
              'expression': 'CREATE',
              'operands': [
                {
                  'expression': 'OR',
                  'operands': [
                    '[bedrag]',
                    '[maximaal]'
                  ]
                }
              ]
            }
          }
        ],
        'duties': []
      }

      const completeFacts = { '[ouder]': true, '[ambtenaar]': true, '[verzoek]': true, '[maximaal]': true }
      const util = new Util(lawReg)

      const { ssids, modelLink } = await util.setupModel(model, ['ambtenaar', 'ouder'], completeFacts)
      const acts = [
        {
          'act': '<<aanvragen kinderbijslag>>',
          'actor': 'ouder'
        },
        {
          'act': '<<aanvraag kinderbijslag toekennen>>',
          'actor': 'ambtenaar'
        }
      ]

      let errorMessage = ''
      try {
        await util.scenarioTest(ssids, modelLink, acts, completeFacts)
      } catch (e) {
        errorMessage = e.message
      }

      expect(errorMessage).to.equal('')
    })
  })

  describe('PROJECTION expression', async function () {
    it('should get the projected property', async () => {
      const model = {
        'acts': [
          {
            'act': '<<subsidie aanvragen>>',
            'actor': '[burger]',
            'recipient': '[ambtenaar]',
            'object': '[verzoek]',
            'preconditions': '[bedrag]',
            'create': [
              '[aanvraag]'
            ]
          },
          {
            'act': '<<subsidie aanvraag toekennen>>',
            'actor': '[ambtenaar]',
            'object': '[aanvraag]',
            'preconditions': {
              'expression': 'EQUAL',
              'operands': [
                {
                  'expression': 'PROJECTION',
                  'context': [
                    '[aanvraag]'
                  ],
                  'fact': '[bedrag]'
                },
                {
                  'expression': 'LITERAL',
                  'operand': 500
                }
              ]
            },
            'recipient': '[burger]'
          }
        ],
        'facts': [
          {
            'fact': '[aanvraag]',
            'function': {
              'expression': 'CREATE',
              'operands': [
                '[bedrag]'
              ]
            }
          }
        ],
        'duties': []
      }

      const completeFacts = { '[burger]': true, '[ambtenaar]': true, '[verzoek]': true, '[bedrag]': 500 }
      const util = new Util(lawReg)

      const { ssids, modelLink } = await util.setupModel(model, ['burger', 'ambtenaar'], { 'burger': '[burger]', 'ambtenaar': '[ambtenaar]' })
      const acts = [
        {
          'act': '<<subsidie aanvragen>>',
          'actor': 'burger'
        },
        {
          'act': '<<subsidie aanvraag toekennen>>',
          'actor': 'ambtenaar'
        }
      ]

      let errorMessage = ''
      try {
        await util.scenarioTest(ssids, modelLink, acts, completeFacts)
      } catch (e) {
        errorMessage = e.message
      }

      expect(completeFacts).to.deep.include({ '[bedrag]': 500 })
      expect(errorMessage).to.equal('')
    })

    it('should project a series of CREATE facts', async () => {
      const model = {
        'acts': [
          {
            'act': '<<persoonlijk gegevens invullen>>',
            'actor': '[burger]',
            'recipient': '[ambtenaar]',
            'object': '[verzoek]',
            'preconditions': '[naam]',
            'create': [
              '[persoonlijke gegevens]'
            ]
          },
          {
            'act': '<<subsidie aanvragen>>',
            'actor': '[burger]',
            'recipient': '[ambtenaar]',
            'object': '[verzoek]',
            'preconditions': {
              'expression': 'AND',
              'operands': [
                '[persoonlijke gegevens]',
                '[bedrag]'
              ]
            },
            'create': [
              '[aanvraag]'
            ]
          },
          {
            'act': '<<subsidie aanvraag toekennen>>',
            'actor': '[ambtenaar]',
            'object': '[aanvraag]',
            'preconditions': {
              'expression': 'EQUAL',
              'operands': [
                {
                  'expression': 'PROJECTION',
                  'context': [
                    '[aanvraag]',
                    '[persoonlijke gegevens]'
                  ],
                  'fact': '[naam]'
                },
                {
                  'expression': 'LITERAL',
                  'operand': 'Discipl'
                }
              ]
            },
            'recipient': '[burger]'
          }
        ],
        'facts': [
          {
            'fact': '[aanvraag]',
            'function': {
              'expression': 'CREATE',
              'operands': [
                '[persoonlijke gegevens]',
                '[bedrag]'
              ]
            }
          },
          {
            'fact': '[persoonlijke gegevens]',
            'function': {
              'expression': 'CREATE',
              'operands': [
                '[naam]'
              ]
            }
          }
        ],
        'duties': []
      }

      const completeFacts = { '[burger]': true, '[ambtenaar]': true, '[verzoek]': true, '[naam]': 'Discipl', '[bedrag]': 500 }
      const util = new Util(lawReg)

      const { ssids, modelLink } = await util.setupModel(model, ['burger', 'ambtenaar'], { 'burger': '[burger]', 'ambtenaar': '[ambtenaar]' })
      const acts = [
        {
          'act': '<<persoonlijk gegevens invullen>>',
          'actor': 'burger'
        },
        {
          'act': '<<subsidie aanvragen>>',
          'actor': 'burger'
        },
        {
          'act': '<<subsidie aanvraag toekennen>>',
          'actor': 'ambtenaar'
        }
      ]

      let errorMessage = ''
      try {
        await util.scenarioTest(ssids, modelLink, acts, completeFacts)
      } catch (e) {
        errorMessage = e.message
      }

      expect(completeFacts).to.deep.include({ '[bedrag]': 500, '[naam]': 'Discipl' })
      expect(errorMessage).to.equal('')
    })

    it('should not allow an act if the projection faild', async () => {
      const model = {
        'acts': [
          {
            'act': '<<subsidie aanvraag toekennen>>',
            'actor': '[ambtenaar]',
            'object': '[aanvraag]',
            'preconditions': {
              'expression': 'EQUAL',
              'operands': [
                {
                  'expression': 'PROJECTION',
                  'context': [
                    '[aanvraag]'
                  ],
                  'fact': '[niet bestaand bedrag]'
                },
                {
                  'expression': 'LITERAL',
                  'operand': 500
                }
              ]
            },
            'recipient': '[burger]'
          }
        ],
        'facts': [
          {
            'fact': '[aanvraag]',
            'function': {
              'expression': 'CREATE',
              'operands': [
                '[bedrag]'
              ]
            }
          }
        ],
        'duties': []
      }

      const completeFacts = { '[burger]': true, '[ambtenaar]': true, '[verzoek]': true, '[bedrag]': 500 }
      const util = new Util(lawReg)

      const { ssids, modelLink } = await util.setupModel(model, ['burger', 'ambtenaar'], { 'burger': '[burger]', 'ambtenaar': '[ambtenaar]' })
      const acts = [
        {
          'act': '<<subsidie aanvraag toekennen>>',
          'actor': 'ambtenaar'
        }
      ]

      let errorMessage = ''
      try {
        await util.scenarioTest(ssids, modelLink, acts, completeFacts)
      } catch (e) {
        errorMessage = e.message
      }

      expect(completeFacts).to.deep.include({ '[bedrag]': 500 })
      expect(errorMessage).to.equal('Action <<subsidie aanvraag toekennen>> is not allowed')
    })
  })
})
