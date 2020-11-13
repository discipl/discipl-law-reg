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
    this.subExpressionCheckers = [
      new AndExpressionChecker(this.serviceProvider),
      new EqualExpressionChecker(this.serviceProvider),
      new IsExpressionChecker(this.serviceProvider),
      new LessThanExpressionChecker(this.serviceProvider),
      new ListExpressionChecker(this.serviceProvider),
      new LiteralExpressionChecker(this.serviceProvider),
      new MaxExpressionChecker(this.serviceProvider),
      new MinExpressionChecker(this.serviceProvider),
      new NotExpressionChecker(this.serviceProvider),
      new OrExpressionChecker(this.serviceProvider),
      new ProductExpressionChecker(this.serviceProvider),
      new SumExpressionChecker(this.serviceProvider),
      new CreateExpressionChecker(this.serviceProvider),
      new ProjectionExpressionChecker(this.serviceProvider)
    ]
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
    const expressionChecker = this.subExpressionCheckers.find((checker) => checker.expression === expr)
    if (context.explanation && fact.expression) {
      context.explanation.expression = fact.expression
    }
    if (expressionChecker) {
      return expressionChecker.checkSubExpression(fact, ssid, context)
    } else {
      this.logger.debug(`Handling: ${expr}`)
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
