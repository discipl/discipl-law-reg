/* eslint-env mocha */
import { expect } from 'chai'
import * as cbd from '../src/index.js'
//import { loadConnector } from '../src/connector-loader.js'

//import sinon from 'sinon'
import { take, toArray } from 'rxjs/operators'

describe('discipl-law-reg', () => {
  describe('The discipl-law-reg library', () => {
    it('should be able to publish and use a simple fictive flint model from JSON', async () => {

      /*

      Fictieve verwelkomingsregeling voor de Staat der Nederlanden

      De Staat der Nederlanden verklaart:

      1. Begripsbepalingen:

      artikel
      1.1 : ingezetene : Een ingezetene van de Staat der Nederlanden
      1.2 : overheid : Ambtenaar aangesteld door de Staat der Nederlanden
      1.3 : betrokkene : Een ingezetene van de Staat der Nederlanden of de Staat der Nederlanden zelf
      1.4 : klacht : een officiele klacht
      1.4 : verwelkomst : een verwelkoming

      2. Verwelkoming

      artikel
      2.1 : ingezetene kan verwelkomst van overheid aanvragen
      2.2 : overheid verwelkomt ingezetene binnen 14 dagen na aanvragen
      2.3 : betrokkene kan verwelkomst annuleren

      3. Klachtprocedure

      artikel
      3.1 : ingezetene kan klacht indienen bij overheid wanneer na 14 dagen geen verwelkomst is ontvangen

      */

      let abundancesvc = dlr.getAbundanceService()
      let core = abundancesvc.getCoreAPI()

      let ssid = core.newSsid('ephemeral')
      let mdl = await dlr.publish(ssid,
        {
          "model" : "Fictieve verwelkomingsregeling Staat der Nederlanden",
          "acts"  : [
            {"act":"ingezetene kan verwelkomst van overheid aanvragen","action":"aanvragen","actor":"[ingezetene]","object":"[verwelkomst]","interested-party":"[overheid]","preconditions":"","create":"<verwelkomen>","terminate":"","reference":"art 2.1"},
            {"act":"overheid verwelkomt ingezetene","action":"verwelkomen","actor":"[overheid]","object":"[verwelkomst]","interested-party":"[ingezetene]","preconditions":"","create":"","terminate":"","reference":"art 2.2"},
            {"act":"betrokkene annuleert verwelkomst","action":"annuleren","actor":"[betrokkene]","object":"[verwelkomst]","interested-party":"[ingezetene]","preconditions":"","create":"","terminate":"<verwelkomen>","reference":"art 2.3"},
            {"act":"ingezetene kan klacht indienen wanneer na 14 dagen geen verwelkomst is ontvangen","action":"klagen","actor":"[betrokkene]","object":"[klacht]","interested-party":"[overheid]","preconditions":"[na 14 dagen geen verwelkomst]","create":"","terminate":"","reference":"art 3.1"}
          ],
          "facts" : [
            {"fact":"ingezetene", "function":"", "reference":"art 1.1"},
            {"fact":"aangesteld als ambtenaar", "function":ssid.did, "art 1.2"},
            {"fact":"overheid", "function":"[aangesteld als ambtenaar]", "reference":"art 1.2"},
            {"fact":"betrokkene", "function":"[ingezetene] OF [overheid]", "reference":"art 1.3"},
            {"fact":"klacht", "function":"", "reference":"art 1.4"},
            {"fact":"verwelkomst", "function":"", "reference":"art 1.5"},
            {"fact":"binnen 14 dagen na aanvragen", "function":"", "reference":"art 2.2"},
            {"fact":"na 14 dagen geen verwelkomst", "function":"", "reference":"art 3.1"}
          ],
          "duties": [
            { "duty":"verwelkomen binnen 14 dagen na aanvragen", "duty-holder":"[overheid]", "claimant":"[ingezetene]", "create":"<<verwelkomen>>", "enforce":"<<klagen>>", "terminate":"", "reference":"art 2.2, art 3.1"}
          ]
        }
      )

      let modelexport = await core.exportLD(ssid.did)
      expect(modelexport).to.equal({

      })

      ssidIngezetene = core.newSsid('ephemeral')
      let status = dlr.get(mdl, ssidIngezetene.did)
      expect(status).to.equal({

      })

      ssidOverheid= core.newSsid('ephemeral')
      status = get(mdl, ssidOverheid.did)
      expect(status).to.equal({

      })

      let ambtenaarClaim = await core.claim(ssidOverheid, 'naam', 'Pietje Puk')
      await core.attest(ssid, 'aangesteld als ambtenaar', ambtenaarClaim)

      ssidOverheid= core.newSsid('ephemeral')
      status = get(mdl, ssidOverheid.did)
      expect(status).to.equal({

      })

      let observable = await dlr.observe(mdl, ssidOverheid)
      let observed = observable.pipe(take(1)).toPromise()

      let case = await dlr.take(ingezeteneSsid, null, status[], null)
      let observable2 = await dlr.observe(mdl, ssidIngezetene)
      let observed2 = observable2.pipe(take(1)).toPromise()

      status = await observed
      expect(status).to.equal({

      })

      await dlr.take(overheidSsid, status[].case, status[].act, 'Hello!')

      status = await observed2
      expect(status).to.equal({

      })

      // and when content with what really happened:
      abundancesvc.solved(case)

    })
  }),
  describe('The discipl-law-reg library with mocked connector', () => {
    it('', async () => {

    })
  })
})
