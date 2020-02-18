class BigUtil {
  static add (a, b) {
    if (a.plus) {
      return a.plus(b)
    }

    if (b.times) {
      return b.plus(a)
    }

    return a + b
  }

  static multiply (a, b) {
    if (a.times) {
      return a.times(b)
    }

    if (b.times) {
      return b.times(a)
    }

    return a * b
  }

  static equal (a, b) {
    if (a.eq) {
      return a.eq(b)
    }

    if (b.eq) {
      return b.eq(a)
    }

    return a === b
  }

  static lessThan (a, b) {
    if (a.lt) {
      return a.lt(b)
    }

    if (b.gt) {
      return b.gt(a)
    }

    return a < b
  }
}

export { BigUtil }
