import { expect } from 'chai';
import ExcelJson from '../src/index';

describe('disciple-iota-connector', function () {
    let exceljson;
    it('log json file in terminal with array of filenames', async () => {
        exceljson = new ExcelJson();
        let arr = ['handeling', 'feit', 'plicht'];

        let json = await exceljson.getArr(arr);

        console.log(json);
        expect(json).not.empty;



    });

});


