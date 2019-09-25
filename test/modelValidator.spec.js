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
  it('should be able to locate definitions', () => {
    const modelValidator = new ModelValidator(sampleModelString)

    const definitionOffset = sampleModelString.indexOf('<<congratulate>>')

    const referenceOffset = sampleModelString.indexOf('<<congratulate>>', definitionOffset + 1)

    // Test an offset in the middle of the word
    let congratulateDefitinion = modelValidator.getDefinitionForOffset(referenceOffset + 6)

    // The offset includes the quote at the beginning
    expect(congratulateDefitinion).to.deep.equal({
      identifier: '<<congratulate>>',
      offset: definitionOffset - 1
    })
  })

  it('should be able to locate all definitions for acts', () => {
    const modelValidator = new ModelValidator(sampleModelString)

    const definitionOffset = sampleModelString.indexOf('<<congratulate>>')

    const allDefinitions = modelValidator.getDefinitionsForType('acts')
    expect(allDefinitions).to.deep.equal([{
      identifier: '<<congratulate>>',
      offset: definitionOffset - 1
    }])
  })

  it('should be able to locate all references for an act', () => {
    const modelValidator = new ModelValidator(sampleModelString)

    const definitionOffset = sampleModelString.indexOf('<<congratulate>>')
    const referenceOffset = sampleModelString.indexOf('<<congratulate>>', definitionOffset + 1)

    const allReferences = modelValidator.getReferencesForOffset(referenceOffset + 5)
    expect(allReferences).to.deep.equal([{
      identifier: '<<congratulate>>',
      offset: definitionOffset - 1
    },
    {
      identifier: '<<congratulate>>',
      offset: referenceOffset - 1
    }])
  })

  it('should find errors with improperly named acts, facts, duties', async () => {
    const model = JSON.stringify({
      'acts': [{ 'act': 'test' }, { 'act': '<<test' }, { 'act': '<<act>>' }],
      'facts': [{ 'fact': 'test' }, { 'fact': '[test' }, { 'fact': '[fact]' }],
      'duties': [{ 'duty': 'test' }, { 'duty': '<test' }, { 'duty': '<duty>' }]
    })

    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors[0]).to.deep.equal({
      'code': 'LR0001',
      'identifier': 'test',
      'message': 'Invalid name for identifier',
      'offset': [139, 145],
      'path': [
        'duties',
        0,
        'duty'
      ],
      'severity': 'ERROR'
    })

    expect(errors.length).to.equal(6)
  })
})
