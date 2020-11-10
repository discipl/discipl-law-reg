/* eslint-env mocha */
import { setupLogging } from './logging'
import { FactResolverOf, runScenario, TakeAction, TakeFailingAction } from './testUtils'

setupLogging()
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

    await runScenario(
      model,
      { '[ouder]': 'ouder', '[minister]': 'minister' },
      [
        TakeAction('ouder', '<<bedrag vaststellen>>', FactResolverOf(completeFacts)),
        TakeAction('ouder', '<<aanvraag kinderbijslag>>', FactResolverOf(completeFacts)),
        TakeAction('minister', '<<aanvraag kinderbijslag toekennen>>', FactResolverOf(completeFacts))
      ]
    )
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

    await runScenario(
      model,
      { '[ouder]': 'ouder', '[minister]': 'minister' },
      [
        TakeFailingAction('minister', '<<aanvraag kinderbijslag toekennen>>', 'Action <<aanvraag kinderbijslag toekennen>> is not allowed due to object', FactResolverOf(completeFacts))
      ]
    )
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

    await runScenario(
      model,
      { '[ouder]': 'ouder', '[minister]': 'minister' },
      [
        TakeAction('ouder', '<<aanvraag kinderbijslag>>', FactResolverOf(completeFacts)),
        TakeFailingAction('minister', '<<aanvraag kinderbijslag toekennen>>', 'Action <<aanvraag kinderbijslag toekennen>> is not allowed due to object', FactResolverOf(completeFacts))
      ]
    )
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

    await runScenario(
      model,
      { '[ouder]': 'ouder', '[ambtenaar]': 'ambtenaar' },
      [
        TakeAction('ouder', '<<aanvragen kinderbijslag>>', FactResolverOf(completeFacts)),
        TakeFailingAction('ambtenaar', '<<aanvraag kinderbijslag toekennen>>', 'Action <<aanvraag kinderbijslag toekennen>> is not allowed due to object', FactResolverOf(completeFacts))
      ]
    )
  })
})
