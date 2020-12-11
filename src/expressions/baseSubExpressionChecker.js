import { getDiscplLogger } from '../utils/logging_util'
// Improve intelisense
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'

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

  /**
   * Get abundance service
   * @return {AbundanceService}
   * @protected
   */
  _getAbundanceService () {
    return this.serviceProvider.abundanceService
  }
}
