// Improve intelisense
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'
import { ContextExplainer } from './contextExplainer'
import { LinkUtils } from './linkUtils'
import { FactChecker } from './factChecker'
import { ActionChecker } from './actionChecker'
import { ExpressionChecker } from './expressions/expressionChecker'
import { ActFetcher } from './actFetcher'

export class ServiceProvider {
  /**
   * Create a ServiceProvider
   * @param {AbundanceService} abundanceService
   */
  constructor (abundanceService) {
    this.abundanceService = abundanceService
    this.contextExplainer = new ContextExplainer()
    this.linkUtils = new LinkUtils(this)
    this.factChecker = new FactChecker(this)
    this.actionChecker = new ActionChecker(this)
    this.expressionChecker = new ExpressionChecker(this)
    this.actFetcher = new ActFetcher(this)
  }

  /**
   * @type {ActionChecker}
   */
  get actionChecker () {
    return this._actionChecker
  }

  /**
   * @param {ActionChecker} value
   */
  set actionChecker (value) {
    this._actionChecker = value
  }

  /**
   * @type {ActFetcher}
   */
  get actFetcher () {
    return this._actFetcher
  }

  /**
   * @param {ActFetcher} value
   */
  set actFetcher (value) {
    this._actFetcher = value
  }

  /**
   * @type {LinkUtils}
   */
  get linkUtils () {
    return this._linkUtils
  }

  /**
   * @param {LinkUtils} value
   */
  set linkUtils (value) {
    this._linkUtils = value
  }

  /**
   * @type {ExpressionChecker}
   */
  get expressionChecker () {
    return this._expressionChecker
  }

  /**
   * @param {ExpressionChecker} value
   */
  set expressionChecker (value) {
    this._expressionChecker = value
  }

  /**
   * @type {AbundanceService}
   */
  get abundanceService () {
    return this._abundanceService
  }

  /**
   * @param {AbundanceService} value
   */
  set abundanceService (value) {
    this._abundanceService = value
  }

  /**
   * @type {FactChecker}
   */
  get factChecker () {
    return this._factChecker
  }

  /**
   * @param {FactChecker} value
   */
  set factChecker (value) {
    this._factChecker = value
  }

  /**
   * @type {ContextExplainer}
   */
  get contextExplainer () {
    return this._contextExplainer
  }

  /**
   * @param {ContextExplainer} value
   */
  set contextExplainer (value) {
    this._contextExplainer = value
  }
}
