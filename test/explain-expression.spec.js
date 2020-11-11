/* eslint-env mocha */
import { setupLogging } from './logging'
import { expectExplainResult, runScenario } from './testUtils'

setupLogging()

describe('discipl-law-reg', () => {
  describe('Explain an expression', () => {
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

      const factResolver = (fact, _item, _listNames, _listIndices, creatingOptions) => {
        if (factSpec.hasOwnProperty(fact)) {
          return factSpec[fact]
        }

        if (['[everyone]', '[explanation]'].includes(fact)) {
          return true
        }
      }

      await runScenario(
        model,
        { 'person': ['[person]'] },
        [
          expectExplainResult('person', '<<explain something>>', expectedResult, factResolver)
        ]
      )
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
      {},
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
      {},
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
})
