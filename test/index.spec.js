/* eslint-env mocha */
import { expect } from 'chai'

import awb from './flint-example-awb'
import IdentityUtil from '../src/utils/identity_util'
import { setupLogging } from './logging'
import {
  expectActiveDuties,
  expectAvailableActs,
  expectData,
  expectModelActDetails,
  expectModelDuty,
  expectModelFact,
  expectPotentialActs,
  expectRetrievedFactFunction,
  factResolverOf,
  runOnModel,
  runScenario,
  takeAction
} from './testUtils'

setupLogging()

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

      await runScenario(
        model,
        { 'actor': [] },
        [
          runOnModel('actor', (modelReference) => {
            expect(Object.keys(modelReference)).to.have.members(['model', 'acts', 'facts', 'duties'])
          }),
          expectModelFact('actor', '[betrokkene]', { 'fact': '[betrokkene]', 'function': '[ingezetene] OF [overheid]', 'reference': 'art 1.3' }),
          expectModelDuty('actor', '<verwelkomen binnen 14 dagen na aanvragen>', {
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
          }),
          expectModelActDetails('actor', '<<ingezetene kan verwelkomst van overheid aanvragen>>', {
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
          })
        ]
      )
    })

    it('should be able to take an action', async () => {
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

      await runScenario(
        model,
        { 'ingezetene': ['[ingezetene]'] },
        [
          takeAction('ingezetene', '<<ingezetene kan verwelkomst van overheid aanvragen>>', () => true),
          expectData('ingezetene', '<<ingezetene kan verwelkomst van overheid aanvragen>>', (actors) => {
            return {
              '[overheid]': true,
              '[verwelkomst]': true,
              '[ingezetene]': IdentityUtil.identityExpression(actors['ingezetene'].did)
            }
          })
        ]
      )
    })

    it('should allow any actor to take an action where the fact is true for ANYONE', async () => {
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
      const completedFacts = { '[verwelkomst]': true, '[overheid]': true }
      await runScenario(
        model,
        { 'someone': [], 'someone else': [], 'ANYONE': ['[ingezetene]'] },
        [
          takeAction('someone', '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolverOf(completedFacts)),
          expectData('someone', '<<ingezetene kan verwelkomst van overheid aanvragen>>', (actors) => {
            return {
              '[overheid]': true,
              '[verwelkomst]': true,
              '[ingezetene]': IdentityUtil.identityExpression(actors['someone'].did)
            }
          }),
          takeAction('someone else', '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolverOf(completedFacts)),
          expectData('someone else', '<<ingezetene kan verwelkomst van overheid aanvragen>>', (actors) => {
            return {
              '[overheid]': true,
              '[verwelkomst]': true,
              '[ingezetene]': IdentityUtil.identityExpression(actors['someone else'].did)
            }
          })
        ]
      )
    })

    it('should be able to set one fact to multiple actors', async () => {
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

      await runScenario(
        model,
        { 'ingezetene1': ['[ingezetene]'], 'ingezetene2': ['[ingezetene]'] },
        [
          expectPotentialActs('ingezetene1', ['<<ingezetene kan verwelkomst van overheid aanvragen>>']),
          expectPotentialActs('ingezetene2', ['<<ingezetene kan verwelkomst van overheid aanvragen>>'])
        ]
      )
    })

    it('should be able to take an action with one fact set to multiple actors', async () => {
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
          { 'fact': '[ingezetene]', 'function': '[]', 'reference': '' },
          { 'fact': '[overheid]', 'function': '[]', 'reference': '' }
        ],
        'duties': []
      }

      await runScenario(
        model,
        { 'ingezetene1': ['[ingezetene]'], 'ingezetene2': ['[ingezetene]'], 'overheid': ['[overheid]'] },
        [
          takeAction('ingezetene1', '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolverOf({ '[verwelkomst]': true })),
          expectData('ingezetene1', '<<ingezetene kan verwelkomst van overheid aanvragen>>', (actors) => {
            return {
              '[ingezetene]': IdentityUtil.identityExpression(actors['ingezetene1'].did),
              '[verwelkomst]': true
            }
          })
        ]
      )
    })

    it('should be able to take an action with an async factresolver', async () => {
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
      const factResolver = async () => true
      await runScenario(
        model,
        { 'ingezetene': ['[ingezetene]'] },
        [
          takeAction('ingezetene', '<<ingezetene kan verwelkomst van overheid aanvragen>>', factResolver),
          expectData('ingezetene', '<<ingezetene kan verwelkomst van overheid aanvragen>>', (actors) => {
            return {
              '[overheid]': true,
              '[verwelkomst]': true,
              '[ingezetene]': IdentityUtil.identityExpression(actors['ingezetene'].did)
            }
          })
        ]
      )
    })

    it('should be able to take an action with a list', async () => {
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

      await runScenario(
        model,
        { 'actor': [] },
        [
          takeAction('actor', '<<kinderbijslag aanvragen>>', factResolver),
          expectData('ingezetene', '<<kinderbijslag aanvragen>>', (actors) => {
            return {
              '[ouder]': IdentityUtil.identityExpression(actors['actor'].did),
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
            }
          })
        ]
      )
    })

    it('should be able to take an action with a nested list', async () => {
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

      await runScenario(
        model,
        { 'actor': [] },
        [
          takeAction('actor', '<<kinderbijslag aanvragen>>', factResolver),
          expectData('ingezetene', '<<kinderbijslag aanvragen>>', (actors) => {
            return {
              '[ouder]': IdentityUtil.identityExpression(actors['actor'].did),
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
            }
          })
        ]
      )
    })

    const verwelkomingsregeling = {
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

    it('should be able to determine active duties', async () => {
      await runScenario(
        verwelkomingsregeling,
        { 'ingezetene': ['[ingezetene]'], 'overheid': ['[overheid]'] },
        [
          takeAction('ingezetene', '<<ingezetene kan verwelkomst van overheid aanvragen>>', () => true),
          expectActiveDuties('ingezetene', []),
          expectActiveDuties('overheid', ['<verwelkomen>'])
        ]
      )
    })

    it('should be able to determine active duties being terminated', async () => {
      await runScenario(
        verwelkomingsregeling,
        { 'overheid': [], 'ingezetene': [] },
        [
          takeAction('ingezetene', '<<ingezetene kan verwelkomst van overheid aanvragen>>', () => true),
          takeAction('ingezetene', '<<ingezetene geeft aan dat verwelkomen niet nodig is>>', () => true),
          expectActiveDuties('ingezetene', []),
          expectActiveDuties('overheid', [])
        ]
      )
    })

    it('should be able to determine available acts', async () => {
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
        'duties': []
      }

      await runScenario(
        model,
        { 'ingezetene': ['[ingezetene]'], 'overheid': ['[overheid]'] },
        [
          expectAvailableActs('ingezetene', []),
          expectAvailableActs('ingezetene', ['<<ingezetene kan verwelkomst van overheid aanvragen>>'], factResolverOf({ '[aanvraag verwelkomst]': true }))
        ]
      )
    })

    it('should be able to determine possible actions with a list', async () => {
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

      await runScenario(
        model,
        { 'actor': [] },
        [
          expectAvailableActs('actor', []),
          expectPotentialActs('actor', ['<<kinderbijslag aanvragen>>'])
        ]
      )
    })

    it('should be able to determine possible actions with a less than', async () => {
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
        'facts': [],
        'duties': []
      }

      await runScenario(
        model,
        { 'actor': [] },
        [
          expectAvailableActs('actor', []),
          expectPotentialActs('actor', ['<<kinderbijslag aanvragen>>'])
        ]
      )
    })

    it('should be able to determine possible actions with multiple options for created facts', async () => {
      const model = {
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
      }
      await runScenario(
        model,
        { 'actor': [] },
        [
          takeAction('actor', '<<kinderbijslag aanvragen>>', () => true),
          takeAction('actor', '<<kinderbijslag aanvragen>>', () => true),
          expectAvailableActs('actor', []),
          expectPotentialActs('actor', ['<<kinderbijslag aanvragen>>', '<<aanvraag kinderbijslag toekennen>>'])
        ]
      )
    })

    it('should not show an act as available when only a not prevents it', async () => {
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
        'duties': []
      }
      await runScenario(
        model,
        { 'ingezetene': ['[ingezetene]'], 'overheid': ['[overheid]'] },
        [
          expectAvailableActs('ingezetene', []),
          expectAvailableActs('ingezetene', [], factResolverOf({ '[aanvraag verwelkomst]': true }))
        ]
      )
    })

    it('should be able to take an action dependent on recursive facts', async () => {
      const completedFacts = {
        '[verzoek een besluit te nemen]': true,
        '[wetgevende macht]': true,
        '[bij wettelijk voorschrift is anders bepaald]': false
      }
      await runScenario(
        awb,
        { 'actor': ['[persoon wiens belang rechtstreeks bij een besluit is betrokken]'] },
        [
          takeAction('actor', '<<indienen verzoek een besluit te nemen>>', factResolverOf(completedFacts)),
          expectData('actor', '<<indienen verzoek een besluit te nemen>>', (actors) => {
            return {
              '[belanghebbende]': IdentityUtil.identityExpression(actors['actor'].did),
              '[bij wettelijk voorschrift is anders bepaald]': false,
              '[verzoek een besluit te nemen]': true,
              '[wetgevende macht]': true
            }
          })
        ]
      )
    })

    it('should be able to take an action where the object originates from another action - AWB', async () => {
      const belanghebbendeFacts = {
        '[persoon wiens belang rechtstreeks bij een besluit is betrokken]': true,
        '[verzoek een besluit te nemen]': true,
        '[wetgevende macht]': true,
        '[bij wettelijk voorschrift is anders bepaald]': false
      }

      const bestuursorgaanFacts = {
        '[persoon wiens belang rechtstreeks bij een besluit is betrokken]': true,
        '[wetgevende macht]': true,
        '[aanvraag is geheel of gedeeltelijk geweigerd op grond van artikel 2:15 Awb]': true
      }

      await runScenario(
        awb,
        { 'belanghebbende': [], 'bestuursorgaan': [] },
        [
          takeAction('belanghebbende', '<<indienen verzoek een besluit te nemen>>', factResolverOf(belanghebbendeFacts)),
          takeAction('bestuursorgaan', '<<besluiten de aanvraag niet te behandelen>>', factResolverOf(bestuursorgaanFacts)),
          expectData('ingezetene', '<<besluiten de aanvraag niet te behandelen>>', (actors, actionLinks) => {
            return {
              '[bestuursorgaan]': IdentityUtil.identityExpression(actors['bestuursorgaan'].did),
              '[aanvraag]': actionLinks[actionLinks.length - 2],
              '[aanvraag is geheel of gedeeltelijk geweigerd op grond van artikel 2:15 Awb]': true,
              '[persoon wiens belang rechtstreeks bij een besluit is betrokken]': true,
              '[wetgevende macht]': true
            }
          })
        ]
      )
    })

    it('should be able to fill functions of single and multiple facts', async () => {
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

      await runScenario(
        model,
        { 'actor': ['[uitreiking besluit aan aanvrager]', '[toezending besluit aan aanvrager]'] },
        [
          expectRetrievedFactFunction('actor', '[uitreiking besluit aan aanvrager]',
            {
              'expression': 'OR',
              'operands': [
                'IS:did:discipl:ephemeral:1234'
              ]
            }),
          expectRetrievedFactFunction('actor', '[toezending besluit aan aanvrager]',
            {
              'expression': 'OR',
              'operands': [
                'IS:did:discipl:ephemeral:1234'
              ]
            })
        ],
        {
          '[uitreiking besluit aan aanvrager]': 'IS:did:discipl:ephemeral:1234',
          '[toezending besluit aan aanvrager]': 'IS:did:discipl:ephemeral:1234'
        }
      )
    })

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
      const factResolver = (fact, _listNames, _listIndices, creatingOptions) => {
        if (['[dough]', '[bakery]', '[baker]'].includes(fact)) {
          return true
        }
        console.log(fact)
        // Last option corresponds to first bake action because this array is populated backwards
        return creatingOptions[1]
      }

      await runScenario(
        model,
        { 'baker': ['[baker]'] },
        [
          takeAction('baker', '<<bake cookie>>', factResolver),
          takeAction('baker', '<<bake cookie>>', factResolver),
          takeAction('baker', '<<eat cookie>>', factResolver),
          expectData('baker', '<<eat cookie>>', (actors, actionLinks) => {
            return {
              '[baker]': IdentityUtil.identityExpression(actors['baker'].did),
              '[bakery]': true,
              '[cookie]': actionLinks[1]
            }
          }),
          takeAction('baker', '<<eat cookie>>', factResolver),
          expectData('baker', '<<eat cookie>>', (actors, actionLinks) => {
            return {
              '[baker]': IdentityUtil.identityExpression(actors['baker'].did),
              '[bakery]': true,
              '[cookie]': actionLinks[2]
            }
          })
        ]
      )
    })
  })
})
