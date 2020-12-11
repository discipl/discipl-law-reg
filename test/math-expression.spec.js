/* eslint-env mocha */
import { setupLogging } from './logging'
import { factResolverFactory, runScenario, takeAction, takeFailingAction } from './testUtils'
import { expect } from 'chai'
import { ServiceProvider } from '../src/serviceProvider'
import sinon from 'sinon'
import { MaxExpressionChecker } from '../src/expressions/maxExpressionChecker'
import { MinExpressionChecker } from '../src/expressions/minExpressionChecker'
import Big from 'big.js'
import { LessThanExpressionChecker } from '../src/expressions/lessThanExpressionChecker'
import { ExpressionChecker } from '../src/services/expressionChecker'
import { SumExpressionChecker } from '../src/expressions/sumExpressionChecker'
import { ProductExpressionChecker } from '../src/expressions/productExpressionChecker'
import { EqualExpressionChecker } from '../src/expressions/equalExpressionChecker'

setupLogging()
describe('discipl-law-reg', () => {
  describe('Math Expressions', () => {
    const testMathExpression = async (precondition, facts, reason) => {
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

      let step = takeAction('mathematician', '<<compute mathematical expression>>', factResolverFactory(completeFacts))
      if (reason) {
        step = takeFailingAction('mathematician', '<<compute mathematical expression>>', `Action <<compute mathematical expression>> is not allowed ${reason}`, factResolverFactory(completeFacts))
      }

      await runScenario(
        model,
        { 'mathematician': [] },
        [
          step
        ]
      )
    }

    const testFalseMathExpression = async (precondition, facts, reason) => {
      await testMathExpression(precondition, facts, reason)
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
      },
      'due to preconditions'
      )
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
      },
      'due to preconditions'
      )
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
      },
      'due to preconditions'
      )
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
      {})
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
      },
      'due to preconditions'
      )
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

    it('should fail to compare non numeric operands', async () => {
      await testFalseMathExpression({
        'expression': 'LESS_THAN',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': false
          },
          {
            'expression': 'LITERAL',
            'operand': 5
          }
        ]
      },
      {},
      'due to preconditions')

      await testFalseMathExpression({
        'expression': 'LESS_THAN',
        'operands': [
          {
            'expression': 'LITERAL',
            'operand': 'three'
          },
          {
            'expression': 'LITERAL',
            'operand': 5
          }
        ]
      },
      {},
      'due to preconditions')
    })

    it('should support numbers in or expressions', async () => {
      await testMathExpression({
        'expression': 'OR',
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

    describe('With non numerical operands', () => {
      const serviceProvider = new ServiceProvider(sinon.mock())
      serviceProvider.expressionChecker = new ExpressionChecker(serviceProvider)
      serviceProvider.expressionChecker.checkExpression = async function (fact, ssid, context) {
        if (fact === '[three]') return Big(3)
        if (fact === '[five]') return Big(5)
        if (fact === '[non-numerical]') return 'non-numerical'
        return undefined
      }

      it('MAX should return undefined when an operand is undefined', async () => {
        const expression = {
          'expression': 'MAX',
          'operands': [
            '[three]',
            '[undefined]',
            '[five]'
          ]
        }
        const result = await new MaxExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(undefined)
      })

      it('MIN should return undefined when an operand is undefined', async () => {
        const expression = {
          'expression': 'MIN',
          'operands': [
            '[three]',
            '[undefined]',
            '[five]'
          ]
        }
        const result = await new MinExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(undefined)
      })

      it('LESS_THAN should return undefined when an operand is undefined', async () => {
        const expression = {
          'expression': 'LESS_THAN',
          'operands': [
            '[three]',
            '[undefined]',
            '[five]'
          ]
        }
        const result = await new LessThanExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(undefined)
      })

      it('SUM should return undefined when an operand is undefined', async () => {
        const expression = {
          'expression': 'SUM',
          'operands': [
            '[three]',
            '[undefined]',
            '[five]'
          ]
        }
        const result = await new SumExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(undefined)
      })

      it('PRODUCT should return undefined when an operand is undefined', async () => {
        const expression = {
          'expression': 'PRODUCT',
          'operands': [
            '[three]',
            '[undefined]',
            '[five]'
          ]
        }
        const result = await new ProductExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(undefined)
      })

      it('EQUAL should return undefined when an operand is undefined', async () => {
        const expression = {
          'expression': 'EQUAL',
          'operands': [
            '[three]',
            '[undefined]',
            '[three]'
          ]
        }
        const result = await new EqualExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(undefined)
      })

      it('MAX should return false when an operand is non numerical', async () => {
        const expression = {
          'expression': 'MAX',
          'operands': [
            '[three]',
            '[non-numerical]',
            '[five]'
          ]
        }
        const result = await new MaxExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(false)
      })

      it('MIN should return false when an operand is non numerical', async () => {
        const expression = {
          'expression': 'MIN',
          'operands': [
            '[three]',
            '[non-numerical]',
            '[five]'
          ]
        }
        const result = await new MinExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(false)
      })

      it('LESS_THAN should return false when an operand is non numerical', async () => {
        const expression = {
          'expression': 'LESS_THAN',
          'operands': [
            '[three]',
            '[non-numerical]',
            '[five]'
          ]
        }
        const result = await new LessThanExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(false)
      })

      it('SUM should return false when an operand is non numerical', async () => {
        const expression = {
          'expression': 'SUM',
          'operands': [
            '[three]',
            '[non-numerical]',
            '[five]'
          ]
        }
        const result = await new SumExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(false)
      })

      it('PRODUCT should return false when an operand is non numerical', async () => {
        const expression = {
          'expression': 'PRODUCT',
          'operands': [
            '[three]',
            '[non-numerical]',
            '[five]'
          ]
        }
        const result = await new ProductExpressionChecker(serviceProvider).checkSubExpression(expression, {}, {})
        expect(result).equals(false)
      })
    })
  })
})
