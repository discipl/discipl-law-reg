export class ContextExplainer {
  /**
   * Extend context with explanation
   * @param {Context} context
   * @return {Context}
   */
  extendContextWithExplanation (context) {
    if (context.explanation) {
      const newExplanation = {}
      if (Array.isArray(context.explanation.operandExplanations)) {
        context.explanation.operandExplanations.push(newExplanation)
      } else {
        context.explanation.operandExplanations = [
          newExplanation
        ]
      }

      return { ...context, explanation: newExplanation }
    } else {
      return context
    }
  }

  /**
   * Extend context explanation with result
   * @param {Context} context
   * @param {*} result
   * @return {Explanation}
   */
  extendContextExplanationWithResult (context, result) {
    if (context.explanation && context.explanation.value == null) {
      if (typeof result === 'object') {
        context.explanation.value = String(result)
      } else {
        context.explanation.value = result
      }
    }
  }
}
