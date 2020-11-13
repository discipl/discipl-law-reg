import { getDiscplLogger } from '../utils/logging_util'

export class ProjectionExpressionChecker {
  /**
   * Create a ProjectionExpressionChecker
   * @param {ServiceProvider} serviceProvider
   */
  constructor (serviceProvider) {
    this.serviceProvider = serviceProvider
    this.logger = getDiscplLogger()
    this.expression = 'PROJECTION'
  }

  /**
   * Get expression checker
   * @return {ExpressionChecker}
   * @private
   */
  _getExpressionChecker () {
    return this.serviceProvider.expressionChecker
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
   * Get fact checker
   * @return {FactChecker}
   * @private
   */
  _getFactChecker () {
    return this.serviceProvider.factChecker
  }

  async checkSubExpression (fact, ssid, context) {
    this.logger.debug(`Handling: ${this.expression}`)
    const core = this._getFactChecker().getAbundanceService().getCoreAPI()
    const lawregContext = context

    if (!fact.context || fact.context.length === 0) {
      throw new Error('A \'context\' array must be given for the PROJECTION expression')
    }

    const initialLink = await this._getFactChecker().checkFact(fact.context[0], ssid, lawregContext)
    const caseLink = await fact.context.slice(1).reduce(async (previousCaseLink, currentContextFact) => {
      if (previousCaseLink) {
        const factContext = await core.get(previousCaseLink, ssid)

        if (Object.keys(factContext.data.DISCIPL_FLINT_FACTS_SUPPLIED).includes(currentContextFact)) {
          return factContext.data.DISCIPL_FLINT_FACTS_SUPPLIED[currentContextFact]
        }
      }
      return undefined
    }, initialLink)

    if (caseLink) {
      const caseObject = await core.get(caseLink, ssid)

      if (Object.keys(caseObject.data.DISCIPL_FLINT_FACTS_SUPPLIED).includes(fact.fact)) {
        const projectionResult = caseObject.data.DISCIPL_FLINT_FACTS_SUPPLIED[fact.fact]
        if (typeof projectionResult === 'object') {
          return this._getFactChecker().checkFact(projectionResult, ssid, context)
        }
        return projectionResult
      }
    }

    return undefined
  }
}
