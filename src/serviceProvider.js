// Improve intelisense
// eslint-disable-next-line no-unused-vars
import { AbundanceService } from '@discipl/abundance-service'
import { ContextExplainer } from './contextExplainer'
import { LinkUtils } from './linkUtils'
import { FactChecker } from './factChecker'
import { ActionChecker } from './actionChecker'
import { ExpressionChecker } from './expressions/expressionChecker'
import { ActFetcher } from './actFetcher'
import { DutyFetcher } from './dutyFetcher'
import { ActionService } from './actionService'
import { ModelPublisher } from './modelPublisher'

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
    this.dutyFetcher = new DutyFetcher(this)
    this.actionService = new ActionService(this)
    this.modelPublisher = new ModelPublisher(this)
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

  /**
   * @type {DutyFetcher}
   */
  get dutyFetcher () {
    return this._dutyFetcher
  }

  /**
   * @param {DutyFetcher} value
   */
  set dutyFetcher (value) {
    this._dutyFetcher = value
  }

  /**
   * @type {ActionService}
   */
  get actionService () {
    return this._actionService
  }

  /**
   * @param {ActionService} value
   */
  set actionService (value) {
    this._actionService = value
  }

  /**
   * @type {ModelPublisher}
   */
  get modelPublisher () {
    return this._modelPublisher
  }

  /**
   * @param {ModelPublisher} value
   */
  set modelPublisher (value) {
    this._modelPublisher = value
  }
}
