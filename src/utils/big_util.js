class BigUtil {
  static genericOp (a, b, functionName, fallbackFunction, commutativeFunctionName = functionName) {
    if (typeof a === 'undefined' || typeof b === 'undefined') {
      return undefined
    }

    if (a[functionName]) {
      return a[functionName](b)
    }

    if (b[commutativeFunctionName]) {
      return b[commutativeFunctionName](a)
    }

    return fallbackFunction()
  }

  static isNumeric (n) {
    const NUMERIC = /^-?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i
    return NUMERIC.test(n += '')
  }

  static add (a, b) {
    return this.genericOp(a, b, 'plus', () => a + b)
  }

  static multiply (a, b) {
    return this.genericOp(a, b, 'times', () => a * b)
  }

  static equal (a, b) {
    return this.genericOp(a, b, 'eq', () => a === b)
  }

  static lessThan (a, b) {
    return this.genericOp(a, b, 'lt', () => a < b, 'gt')
  }
}

export { BigUtil }
