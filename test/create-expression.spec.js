/* eslint-env mocha */
import { setupLogging } from './logging'
import { factResolverOf, runScenario, takeAction, takeFailingAction } from './testUtils'

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
      { 'ouder': ['[ouder]'], 'minister': ['[minister]'] },
      [
        takeAction('ouder', '<<bedrag vaststellen>>', factResolverOf(completeFacts)),
        takeAction('ouder', '<<aanvraag kinderbijslag>>', factResolverOf(completeFacts)),
        takeAction('minister', '<<aanvraag kinderbijslag toekennen>>', factResolverOf(completeFacts))
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
      { 'ouder': ['[ouder]'], 'minister': ['[minister]'] },
      [
        takeFailingAction('minister', '<<aanvraag kinderbijslag toekennen>>', 'Action <<aanvraag kinderbijslag toekennen>> is not allowed due to object', factResolverOf(completeFacts))
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
      { 'ouder': ['[ouder]'], 'minister': ['[minister]'] },
      [
        takeAction('ouder', '<<aanvraag kinderbijslag>>', factResolverOf(completeFacts)),
        takeFailingAction('minister', '<<aanvraag kinderbijslag toekennen>>', 'Action <<aanvraag kinderbijslag toekennen>> is not allowed due to object', factResolverOf(completeFacts))
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
      { 'ouder': ['[ouder]'], 'ambtenaar': ['[ambtenaar]'] },
      [
        takeAction('ouder', '<<aanvragen kinderbijslag>>', factResolverOf(completeFacts)),
        takeFailingAction('ambtenaar', '<<aanvraag kinderbijslag toekennen>>', 'Action <<aanvraag kinderbijslag toekennen>> is not allowed due to object', factResolverOf(completeFacts))
      ]
    )
  })
})
