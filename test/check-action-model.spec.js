/* eslint-env mocha */
import { expect } from 'chai'

import sinon from 'sinon'
import { setupLogging } from './logging'
import { expectCheckActionResult, runScenario, simpleFactResolverFactory } from './testUtils'

setupLogging()
describe('discipl-law-reg', () => {
  describe('checkActionModel', () => {
    const checkActionModel = {
      'acts': [{
        'act': '<<ingezetene kan verwelkomst van overheid aanvragen>>',
        'action': '[aanvragen]',
        'actor': '[aanvrager]',
        'object': '[verwelkomst]',
        'recipient': '[overheid]',
        'preconditions': '[]',
        'create': '<verwelkomen>',
        'terminate': '',
        'reference': 'art 2.1',
        'sourcetext': '',
        'explanation': '',
        'version': '2-[19980101]-[jjjjmmdd]',
        'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:3&lid=3&z=2017-03-01&g=2017-03-01'
      }],
      'facts': [{
        'explanation': '',
        'fact': '[belanghebbende]',
        'function': '[persoon wiens belang rechtstreeks bij een besluit is betrokken]',
        'reference': 'art. 1:2 lid 1 Awb',
        'version': '2-[19940101]-[jjjjmmdd]',
        'juriconnect': 'jci1.3:c:BWBR0005537&hoofdstuk=1&titeldeel=1.1&artikel=1:2&lid=1&z=2017-03-10&g=2017-03-10',
        'sourcetext': '{Onder belanghebbende wordt verstaan: degene wiens belang rechtstreeks bij een besluit is betrokken}'
      }, {
        'explanation': '',
        'fact': '[aanvrager]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }, {
        'explanation': '',
        'fact': '[toezending besluit aan aanvrager]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }, {
        'explanation': '',
        'fact': '[toezending besluit aan meer belanghebbenden]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }, {
        'explanation': '',
        'fact': '[uitreiking besluit aan aanvrager]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }, {
        'explanation': '',
        'fact': '[uitreiking besluit aan meer belanghebbenden]',
        'function': '[]',
        'reference': 'art 3:41 lid 1 Awb',
        'version': '',
        'juriconnect': '',
        'sourcetext': ''
      }],
      'duties': []
    }

    it('should perform a checkAction', async () => {
      await runScenario(
        checkActionModel,
        { 'aanvrager': ['[aanvrager]'] },
        [
          expectCheckActionResult(
            'aanvrager',
            '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            {
              'invalidReasons': [],
              'valid': true
            },
            simpleFactResolverFactory(true)
          )
        ]
      )
    })

    it('should perform a checkAction with async factResolver', async () => {
      await runScenario(
        checkActionModel,
        { 'aanvrager': ['[aanvrager]'] },
        [
          expectCheckActionResult(
            'aanvrager',
            '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            {
              'invalidReasons': [],
              'valid': true
            },
            simpleFactResolverFactory(true)
          )
        ]
      )
    })

    it('should perform a checkAction with false result', async () => {
      await runScenario(
        checkActionModel,
        { 'aanvrager': ['[aanvrager]'] },
        [
          expectCheckActionResult(
            'aanvrager',
            '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            {
              'invalidReasons': [
                'object',
                'recipient'
              ],
              'valid': false
            },
            simpleFactResolverFactory(false)
          )
        ]
      )
    })

    it('should short-circuit a checkAction if needed', async () => {
      const factResolver = sinon.stub()
      factResolver.returns(false)
      const factResolverFactory = () => factResolver

      await runScenario(
        checkActionModel,
        { 'aanvrager': ['[aanvrager]'] },
        [
          expectCheckActionResult(
            'aanvrager',
            '<<ingezetene kan verwelkomst van overheid aanvragen>>',
            {
              'invalidReasons': [
                'object'
              ],
              'valid': false
            },
            factResolverFactory,
            true
          )
        ]
      )

      expect(factResolver.callCount).to.equal(1)
      expect(factResolver.args[0][0]).to.equal('[verwelkomst]')
    })
  })
})
