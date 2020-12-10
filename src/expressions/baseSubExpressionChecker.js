import { getDiscplLogger } from '../utils/logging_util'

export class BaseSubExpressionChecker {
  /**
   * Create a SubExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
  }

  /**
   * Get expression checker
   * @return {ExpressionChecker}
   * @protected
   */
  _getExpressionChecker () {
    return this.serviceProvider.expressionChecker
  }

  /**
   * Get context explainer
   * @return {ContextExplainer}
   * @protected
   */
  _getContextExplainer () {
    return this.serviceProvider.contextExplainer
  }

  /**
   * Get fact checker
   * @return {FactChecker}
   * @protected
   */
  _getFactChecker () {
    return this.serviceProvider.factChecker
  }
}
