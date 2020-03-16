class ValidationError {
  /**
   * Construct a new validation error.
   * @param {string} code - Unique code to relate back to the error
   * @param {string} message - Human readable message describing the problem
   * @param {Array<number>} offset - Begin and end offset of the error
   * @param {('ERROR'|'WARNING')} severity - Severity of the error
   * @param {string|undefined} source - Text that relates to the cause of the error
   * @param {Array<string|number>|undefined} path - Path to the error
   */
  constructor (code, message, offset, severity, source, path) {
    this.code = code
    this.message = message
    this.offset = offset
    this.severity = severity
    this.source = source
    this.path = path
  }
}

export { ValidationError }
