class IdentityUtil {
  /**
   * Create an identity expression for a ssid
   *
   * @param {string} did - The did for the expression
   * @returns {object} The identity expression
   */
  static identityExpression (did) {
    return {
      'expression': 'IS',
      'operand': did
    }
  }
}

export default IdentityUtil
