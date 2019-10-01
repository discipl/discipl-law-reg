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
      'source': 'test',
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

  it('should find undefined facts used in acts', async () => {
    const model = JSON.stringify({
      'acts': [{ 'act': '<<act>>', 'actor': '[canary]', 'object': '[birdfood]', 'interested-party': '[cat]' }],
      'facts': [],
      'duties': []
    })
    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors).to.deep.equal([
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          35,
          43
        ],
        'path': [
          'acts',
          0,
          'actor'
        ],
        'severity': 'WARNING',
        'source': '[canary]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          55,
          65
        ],
        'path': [
          'acts',
          0,
          'object'
        ],
        'severity': 'WARNING',
        'source': '[birdfood]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          87,
          92
        ],
        'path': [
          'acts',
          0,
          'interested-party'
        ],
        'severity': 'WARNING',
        'source': '[cat]'
      }
    ]
    )
  })

  it('should find undefined facts and duties used in acts in create and terminate', async () => {
    const model = JSON.stringify({
      'acts': [{ 'act': '<<act>>', 'create': '[cats];<dogs>', 'terminate': '[sunshine];<rain>' }],
      'facts': [],
      'duties': []
    })
    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors).to.deep.equal([
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          36,
          42
        ],
        'path': [
          'acts',
          0,
          'create'
        ],
        'severity': 'WARNING',
        'source': '[cats]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          43,
          49
        ],
        'path': [
          'acts',
          0,
          'create'
        ],
        'severity': 'WARNING',
        'source': '<dogs>'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          64,
          74
        ],
        'path': [
          'acts',
          0,
          'terminate'
        ],
        'severity': 'WARNING',
        'source': '[sunshine]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          75,
          81
        ],
        'path': [
          'acts',
          0,
          'terminate'
        ],
        'severity': 'WARNING',
        'source': '<rain>'
      }
    ]
    )
  })

  it('should find invalid expressions in preconditions', async () => {
    const model = JSON.stringify({
      'acts': [{ 'act': '<<act>>', 'preconditions': '(not really parsable]}' }],
      'facts': [],
      'duties': []
    })

    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors).to.deep.equal([
      {
        'code': 'LR0003',
        'message': 'Syntax Error: Expected "(", "NIET", or "[" but "n" found.',
        'offset': [
          42,
          64
        ],
        'severity': 'ERROR',
        'source': '(not really parsable]}'
      }
    ]
    )
  })

  it('should find undefined facts used in acts in fact functions', async () => {
    const model = JSON.stringify({
      'acts': [],
      'facts': [{ 'fact': '[factname]', 'function': '([cats] OF [dogs]) EN [sunshine]' }],
      'duties': []
    })
    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors).to.deep.equal([
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          54,
          60
        ],
        'path': [
          'facts',
          0,
          'function'
        ],
        'severity': 'WARNING',
        'source': '[cats]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          64,
          70
        ],
        'path': [
          'facts',
          0,
          'function'
        ],
        'severity': 'WARNING',
        'source': '[dogs]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          75,
          85
        ],
        'path': [
          'facts',
          0,
          'function'
        ],
        'severity': 'WARNING',
        'source': '[sunshine]'
      }
    ]
    )
  })
})
