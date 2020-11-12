import { getDiscplLogger } from '../loggingUtil'
import { AndExpressionChecker } from './andExpressionChecker'
import { CreateExpressionChecker } from './createExpressionChecker'
import { EqualExpressionChecker } from './equalExpressionChecker'
import { IsExpressionChecker } from './isExpressionChecker'
import { LessThanExpressionChecker } from './lessThanExpressionChecker'
import { ListExpressionChecker } from './listExpressionChecker'
import { LiteralExpressionChecker } from './literalExpressionChecker'
import { MaxExpressionChecker } from './maxExpressionChecker'
import { MinExpressionChecker } from './minExpressionChecker'
import { NotExpressionChecker } from './notExpressionChecker'
import { OrExpressionChecker } from './orExpressionChecker'
import { ProductExpressionChecker } from './productExpressionChecker'
import { ProjectionExpressionChecker } from './projectionExpressionChecker'
import { SumExpressionChecker } from './sumExpressionChecker'

export class ExpressionChecker {
  /**
   * Create a ExpressionChecker
   * @param {ContextExplainer} contextExplainer
   * @param {FactChecker} factChecker
   */
  constructor (contextExplainer, factChecker) {
    this.contextExplainer = contextExplainer
    this.logger = getDiscplLogger()
    this.factChecker = factChecker
    this.subExpressionCheckers = [
      new AndExpressionChecker(this, contextExplainer),
      new EqualExpressionChecker(this, contextExplainer),
      new IsExpressionChecker(this, contextExplainer),
      new LessThanExpressionChecker(this, contextExplainer),
      new ListExpressionChecker(this, contextExplainer),
      new LiteralExpressionChecker(this, contextExplainer),
      new MaxExpressionChecker(this, contextExplainer),
      new MinExpressionChecker(this, contextExplainer),
      new NotExpressionChecker(this, contextExplainer),
      new OrExpressionChecker(this, contextExplainer),
      new ProductExpressionChecker(this, contextExplainer),
      new SumExpressionChecker(this, contextExplainer),
      new CreateExpressionChecker(this, contextExplainer, factChecker),
      new ProjectionExpressionChecker(this, contextExplainer, factChecker)
    ]
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
        const result = await this.factChecker.checkFact(fact, ssid, context)

        this.contextExplainer.extendContextExplanationWithResult(context, result)
        return result
      }

      throw new Error('Unknown expression type ' + expr)
    }
  }
}
