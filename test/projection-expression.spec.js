/* eslint-env mocha */
import { ExpectAvailableActs, ExpectPotentialAct, ExpectPotentialActs, FactResolverOf, runScenario, TakeAction, TakeFailingAction } from './testUtils'
import { setupLogging } from './logging'

setupLogging()
describe('PROJECTION expression', async function () {
  describe('With subsidieModel', async function () {
    const subsidieModel = {
      'acts': [
        {
          'act': '<<subsidie aanvragen>>',
          'actor': '[burger]',
          'action': '[aanvragen]',
          'object': '[verzoek]',
          'recipient': '[ambtenaar]',
          'preconditions': '[bedrag]',
          'create': [
            '[aanvraag]'
          ],
          'terminate': [],
          'sources': [],
          'explanation': ''
        },
        {
          'act': '<<subsidie aanvraag intrekken>>',
          'actor': '[burger with aanvraag]',
          'action': '[intrekken]',
          'object': '[aanvraag]',
          'recipient': '[ambtenaar]',
          'preconditions': '[]',
          'create': [],
          'terminate': [
            '[aanvraag]'
          ],
          'sources': [],
          'explanation': ''
        },
        {
          'act': '<<subsidie aanvraag toekennen>>',
          'actor': '[ambtenaar]',
          'action': '[toekennen]',
          'object': '[aanvraag]',
          'recipient': '[burger]',
          'preconditions': {
            'expression': 'LESS_THAN',
            'operands': [
              '[bedrag projection]',
              {
                'expression': 'LITERAL',
                'operand': 500
              }
            ]
          },
          'create': [],
          'terminate': [
            '[aanvraag]'
          ],
          'sources': [],
          'explanation': ''
        }
      ],
      'facts': [
        {
          'fact': '[bedrag]',
          'function': '[]',
          'sources': []
        },
        {
          'fact': '[aanvraag]',
          'function': {
            'expression': 'CREATE',
            'operands': [
              '[bedrag]',
              '[burger]'
            ]
          },
          'sources': []
        },
        {
          'fact': '[bedrag projection]',
          'function': {
            'expression': 'PROJECTION',
            'context': [
              '[aanvraag]'
            ],
            'fact': '[bedrag]'
          },
          'sources': []
        },
        {
          'fact': '[burger with aanvraag]',
          'function': {
            'expression': 'PROJECTION',
            'context': [
              '[aanvraag]'
            ],
            'fact': '[burger]'
          },
          'sources': []
        },
        {
          'fact': '[burger]',
          'function': '[]',
          'sources': []
        },
        {
          'fact': '[verzoek]',
          'function': '[]',
          'sources': []
        },
        {
          'fact': '[ambtenaar]',
          'function': '[]',
          'sources': []
        },
        {
          'fact': '[aanvragen]',
          'function': '[]',
          'sources': []
        },
        {
          'fact': '[toekennen]',
          'function': '[]',
          'sources': []
        }
      ],
      'duties': []
    }

    it('should be able to have multiple of the same type of actor', async () => {
      const facts = { '[bedrag]': 50, '[verzoek]': true }
      await runScenario(
        subsidieModel,
        { '[ambtenaar]': ['ambtenaar'], '[burger]': ['burger1', 'burger2'] },
        [
          ExpectAvailableActs('burger1', ['<<subsidie aanvragen>>'], FactResolverOf(facts)),
          TakeAction('burger1', '<<subsidie aanvragen>>', FactResolverOf(facts)),
          ExpectAvailableActs('burger1', ['<<subsidie aanvraag intrekken>>']),
          ExpectAvailableActs('burger2', []),
          ExpectAvailableActs('ambtenaar', ['<<subsidie aanvraag toekennen>>'])
        ]
      )
    })

    it('should call getPotentialActs multiple times without breaking PROJECTION expressions', async () => {
      await runScenario(
        subsidieModel,
        { '[ambtenaar]': ['ambtenaar'], '[burger]': ['burger'] },
        [
          ExpectPotentialActs('burger', ['<<subsidie aanvragen>>']),
          ExpectPotentialActs('ambtenaar', [])
        ]
      )
    })

    it('should get the projected property', async () => {
      const completeFacts = { '[verzoek]': true, '[bedrag]': 500 }
      await runScenario(
        subsidieModel,
        { '[ambtenaar]': ['ambtenaar'], '[burger]': ['burger', 'burger1'] },
        [
          TakeAction('burger', '<<subsidie aanvragen>>', FactResolverOf(completeFacts)),
          TakeAction('ambtenaar', '<<subsidie aanvraag toekennen>>', FactResolverOf(completeFacts))
        ]
      )
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

      await runScenario(
        model,
        { '[burger]': ['burger'], '[ambtenaar]': ['ambtenaar'] },
        [
          TakeAction('burger', '<<persoonlijk gegevens invullen>>', FactResolverOf(completeFacts)),
          TakeAction('burger', '<<subsidie aanvragen>>', FactResolverOf(completeFacts)),
          TakeAction('ambtenaar', '<<subsidie aanvraag toekennen>>', FactResolverOf(completeFacts))
        ]
      )
    })

    it('should not allow an act if the projection failed', async () => {
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

      await runScenario(
        model,
        { '[burger]': ['burger'], '[ambtenaar]': ['ambtenaar'] },
        [
          TakeFailingAction('burger', '<<subsidie aanvraag toekennen>>', 'Action <<subsidie aanvraag toekennen>> is not allowed due to object', FactResolverOf(completeFacts))
        ]
      )
    })

    it('should be able to take an action after object is created from other action', async () => {
      await runScenario(
        subsidieModel,
        { '[ambtenaar]': 'ambtenaar', '[burger]': 'burger' },
        [
          TakeAction('burger', '<<subsidie aanvragen>>', FactResolverOf({ '[verzoek]': true, '[bedrag]': 50 })),
          ExpectAvailableActs('ambtenaar', ['<<subsidie aanvraag toekennen>>']),
          ExpectPotentialActs('burger', ['<<subsidie aanvragen>>']),
          ExpectAvailableActs('burger', ['<<subsidie aanvraag intrekken>>']),
          TakeAction('ambtenaar', '<<subsidie aanvraag toekennen>>', FactResolverOf({ '[verzoek]': true })),
          ExpectAvailableActs('ambtenaar', [])
        ]
      )
    })
  })

  describe('With calculatorModel', async function () {
    function calculatorModel (precondition) {
      return {
        'acts': [
          {
            'act': '<<give a number>>',
            'actor': '[actor1]',
            'action': 'action',
            'object': '[calculator]',
            'recipient': '[actor1]',
            'preconditions': '[number]',
            'create': [
              '[paper]'
            ],
            'terminate': [],
            'sources': [],
            'explanation': ''
          },
          {
            'act': '<<accept number>>',
            'actor': '[actor1]',
            'action': 'accept',
            'object': '[calculator]',
            'recipient': '[actor1]',
            'preconditions': precondition,
            'create': [],
            'terminate': [],
            'sources': [],
            'explanation': ''
          }
        ],
        'facts': [
          {
            'fact': '[actor1]',
            'explanation': '',
            'function': '[]',
            'sources': []
          },
          {
            'fact': '[calculator]',
            'explanation': '',
            'function': '[]',
            'sources': []
          },
          {
            'fact': '[paper]',
            'explanation': '',
            'function': {
              'expression': 'CREATE',
              'operands': [
                '[number]'
              ]
            },
            'sources': []
          },
          {
            'fact': '[number]',
            'explanation': '',
            'function': '[]',
            'sources': []
          }
        ],
        'duties': []
      }
    }

    it('EQUAL should return undefined when a PROJECTION expression returns undefined', async () => {
      const model = calculatorModel({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 10
          },
          {
            'expression': 'PROJECTION',
            'context': [
              '[paper]'
            ],
            'fact': '[number]'
          }
        ]
      })

      const facts = { '[number]': 10, '[calculator]': true }
      await runScenario(
        model,
        { '[actor1]': 'Actor' },
        [
          TakeAction('Actor', '<<give a number>>', FactResolverOf(facts)),
          ExpectPotentialAct('Actor', '<<accept number>>'),
          TakeAction('Actor', '<<give a number>>', FactResolverOf(facts)),
          ExpectPotentialAct('Actor', '<<accept number>>')
        ]
      )
    })

    it('LESS THAN should return undefined when a PROJECTION expression returns undefined', async () => {
      const model = calculatorModel({
        'expression': 'LESS_THAN',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 1
          },
          {
            'expression': 'PROJECTION',
            'context': [
              '[paper]'
            ],
            'fact': '[number]'
          }
        ]
      })

      const facts = { '[number]': 10, '[calculator]': true }
      await runScenario(
        model,
        { '[actor1]': 'Actor' },
        [
          TakeAction('Actor', '<<give a number>>', FactResolverOf(facts)),
          ExpectPotentialAct('Actor', '<<accept number>>'),
          TakeAction('Actor', '<<give a number>>', FactResolverOf(facts)),
          ExpectPotentialAct('Actor', '<<accept number>>')
        ]
      )
    })

    it('SUM should return undefined when a PROJECTION expression returns undefined', async () => {
      const model = calculatorModel({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 11
          },
          {
            'expression': 'SUM',
            'operands': [
              {
                'expression': 'LITERAL',
                'operand': 1
              },
              {
                'expression': 'PROJECTION',
                'context': [
                  '[paper]'
                ],
                'fact': '[number]'
              }
            ]
          }
        ]
      })

      const facts = { '[number]': 10, '[calculator]': true }
      await runScenario(
        model,
        { '[actor1]': 'Actor' },
        [
          TakeAction('Actor', '<<give a number>>', FactResolverOf(facts)),
          ExpectPotentialAct('Actor', '<<accept number>>'),
          TakeAction('Actor', '<<give a number>>', FactResolverOf(facts)),
          ExpectPotentialAct('Actor', '<<accept number>>')
        ]
      )
    })

    it('PRODUCT should return undefined when a PROJECTION expression returns undefined', async () => {
      const model = calculatorModel({
        'expression': 'EQUAL',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 20
          },
          {
            'expression': 'PRODUCT',
            'operands': [
              {
                'expression': 'LITERAL',
                'operand': 2
              },
              {
                'expression': 'PROJECTION',
                'context': [
                  '[paper]'
                ],
                'fact': '[number]'
              }
            ]
          }
        ]
      })

      const facts = { '[number]': 10, '[calculator]': true }
      await runScenario(
        model,
        { '[actor1]': 'Actor' },
        [
          TakeAction('Actor', '<<give a number>>', FactResolverOf(facts)),
          ExpectPotentialAct('Actor', '<<accept number>>'),
          TakeAction('Actor', '<<give a number>>', FactResolverOf(facts)),
          ExpectPotentialAct('Actor', '<<accept number>>')
        ]
      )
    })
  })
})
