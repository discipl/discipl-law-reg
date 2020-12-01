import { getDiscplLogger } from '../utils/logging_util'
import { AndExpressionChecker } from '../expressions/andExpressionChecker'
import { CreateExpressionChecker } from '../expressions/createExpressionChecker'
import { EqualExpressionChecker } from '../expressions/equalExpressionChecker'
import { IsExpressionChecker } from '../expressions/isExpressionChecker'
import { LessThanExpressionChecker } from '../expressions/lessThanExpressionChecker'
import { ListExpressionChecker } from '../expressions/listExpressionChecker'
import { LiteralExpressionChecker } from '../expressions/literalExpressionChecker'
import { MaxExpressionChecker } from '../expressions/maxExpressionChecker'
import { MinExpressionChecker } from '../expressions/minExpressionChecker'
import { NotExpressionChecker } from '../expressions/notExpressionChecker'
import { OrExpressionChecker } from '../expressions/orExpressionChecker'
import { ProductExpressionChecker } from '../expressions/productExpressionChecker'
import { ProjectionExpressionChecker } from '../expressions/projectionExpressionChecker'
import { SumExpressionChecker } from '../expressions/sumExpressionChecker'

export class ExpressionChecker {
  /**
   * Create a ExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.logger = getDiscplLogger()
    this.serviceProvider = serviceProvider

    this.subExpressionCheckers = {
      'AND': new AndExpressionChecker(this.serviceProvider),
      'CREATE': new CreateExpressionChecker(this.serviceProvider),
      'EQUAL': new EqualExpressionChecker(this.serviceProvider),
      'IS': new IsExpressionChecker(this.serviceProvider),
      'LESS_THAN': new LessThanExpressionChecker(this.serviceProvider),
      'LIST': new ListExpressionChecker(this.serviceProvider),
      'LITERAL': new LiteralExpressionChecker(this.serviceProvider),
      'MAX': new MaxExpressionChecker(this.serviceProvider),
      'MIN': new MinExpressionChecker(this.serviceProvider),
      'NOT': new NotExpressionChecker(this.serviceProvider),
      'OR': new OrExpressionChecker(this.serviceProvider),
      'PRODUCT': new ProductExpressionChecker(this.serviceProvider),
      'PROJECTION': new ProjectionExpressionChecker(this.serviceProvider),
      'SUM': new SumExpressionChecker(this.serviceProvider)
    }
  }

  /**
   * Get fact checker
   * @return {FactChecker}
   * @private
   */
  _getFactChecker () {
    return this.serviceProvider.factChecker
  }

  /**
   * Get context explainer
   * @return {ContextExplainer}
   * @private
   */
  _getContextExplainer () {
    return this.serviceProvider.contextExplainer
  }

  /**
   * Checks a parsed expression by considering the atomic parts and evaluating them
   *
   * @param {ParsedExpression|string} fact - Parsed fact object (might be string if the object is an atomic fact)
   * @param {object} ssid - Identity doing the checking
   * @param {Context} context - Context of the check
   * @returns {Promise<boolean>}
   */
  async checkExpression (fact, ssid, context) {
    const expr = fact.expression
    this.logger.debug(`Handling: ${expr}`)
    const expressionChecker = this.subExpressionCheckers[expr]
    if (context.explanation && fact.expression) {
      context.explanation.expression = fact.expression
    }
    if (expressionChecker) {
      return expressionChecker.checkSubExpression(fact, ssid, context)
    } else {
      if (typeof fact === 'string') {
        // Purposely do not alter context for explanation, this happens in checkFact
        const result = await this._getFactChecker().checkFact(fact, ssid, context)

        this._getContextExplainer().extendContextExplanationWithResult(context, result)
        return result
      }

      throw new Error('Unknown expression type ' + expr)
    }
  }
}
