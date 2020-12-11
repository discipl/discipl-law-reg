/**
 * @typedef {object} CheckActionResult
 * @property {boolean|*} valid - True iff the action can be taken, undefined if undefined facts would need to be provided to be sure
 * @property {string[]} invalidReasons - Flint items that were resolved as false
 */

/**
 * @typedef {Object} Context
 * @property {function} factResolver - Function to resolve facts if it cannot be done another way
 * @property {string} caseLink - Link to the current case
 * @property {object} [facts] - Parsed facts from flint model
 * @property {object} [factsSupplied] - Parsed facts from flint model
 * @property {string} [previousFact] - last fact that was considered in the context
 * @property {string|undefined} [searchingFor] - the fact we are searching for from PROJECTION expression
 * @property {boolean} [myself] - `IS:` constructions will be resolved if it concerns the person themselves
 * @property {object} [factReference] - Map from fact names to fact links in a published FLINT model
 * @property {array} [listNames] - Names of (subsequent) lists that belong to the current context
 * @property {array} [listIndices] - Index of current location in the list
 * @property {Explanation} [explanation] - Object containing nested explanations
 */

/**
 * @typedef {Object} Explanation
 * @property {string|undefined} fact - Name of the fact under consideration
 * @property {*} value - Value of this fact
 * @property {string|undefined} expression - Expression type of this fact
 * @property {Array<Explanation>|undefined} - operandExplanations Subexplanations of operands
 */

/**
 * @typedef DutyInformation
 * @property {string} duty - name of the duty
 * @property {string} link - link to the duty in the model
 */

/**
 * @typedef ActionInformation
 * @property {string} act - Name of the act taken
 * @property {string} link - Link to the action
 */

/**
 * @typedef {Object} ParsedExpression
 * @property {string} expression - The type of expression (AND/OR/NOT)
 * @property {Array.<ParsedExpression|string>} [operands] - Operands of an AND/OR
 * @property {ParsedExpression|string} [operand] - Operand of a NOT
 */

/**
 * @typedef CreatingAct
 * @property {string} link - Act link
 * @property {string} contextFact - The fact that was created by this act
 * @property {Object<string, *>} facts - Facts provided for act
 */
