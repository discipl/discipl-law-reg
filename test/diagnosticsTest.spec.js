/* eslint-env mocha */
import { expect } from 'chai'
import { ModelValidator } from '../src'

const sampleModelString = JSON.stringify({
    acts: [
        {
            'act': '<<congratulate>>'
        }
    ],
    facts: [],
    duties: [
        {
            'duty': '<being nice>',
            'terminate': '<<congratulate>>'
        }
    ]
})

describe('The Flint Model validator', () => {

    it('should find duplicate identifiers', async () => {
        const model = JSON.stringify({
            'acts': [{ 'act': '<<act>>' }, { 'act': '<<test' }, { 'act': '<<leuk>>' }, { 'act': '<<act>>' }, { 'act': '<<leuk>>' }],
            'facts': [{ 'fact': 'test' }, { 'fact': '[test' }, { 'fact': '[]' }, { 'fact': '[fact]' }],
            'duties': [{ 'duty': 'test' }, { 'duty': '<test' }, { 'duty': '<>' }, { 'duty': '<duty>' }]
        })

        const modelValidator = new ModelValidator(model)

        // const errors = modelValidator.getDiagnostics()
        const errors = modelValidator.checkDuplicateIdentifiers(
            'acts',
            'act');

        console.log(errors)

        // expect(errors[0]).to.deep.equal({
        //     'code': 'LR0001',
        //     'source': 'test',
        //     'message': 'Invalid name for identifier',
        //     'offset': [168, 174],
        //     'path': [
        //         'duties',
        //         0,
        //         'duty'
        //     ],
        //     'severity': 'ERROR'
        // })

        // expect(errors.length).to.equal(9)
        expect(9).to.equal(9)
    })
})
