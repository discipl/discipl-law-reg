import { BaseSubExpressionChecker } from './baseSubExpressionChecker'

export class ProjectionExpressionChecker extends BaseSubExpressionChecker {
  async checkSubExpression (fact, ssid, context) {
    const core = this._getFactChecker().getAbundanceService().getCoreAPI()
    const lawregContext = context

    if (!fact.context || fact.context.length === 0) {
      throw new Error('A \'context\' array must be given for the PROJECTION expression')
    }

    lawregContext.searchingFor = fact.fact
    const initialLink = await this._getFactChecker().checkFact(fact.context[0], ssid, lawregContext)
    const caseLink = await fact.context.slice(1).reduce(async (previousCaseLink, currentContextFact) => {
      if (previousCaseLink) {
        const factContext = await core.get(previousCaseLink, ssid)

        if (Object.keys(factContext.data.DISCIPL_FLINT_FACTS_SUPPLIED).includes(currentContextFact)) {
          return factContext.data.DISCIPL_FLINT_FACTS_SUPPLIED[currentContextFact]
        }
      }
      return previousCaseLink
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

    return caseLink
  }
}
