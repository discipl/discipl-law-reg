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
    const congratulateDefitinion = modelValidator.getDefinitionForOffset(referenceOffset + 6)

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
      'acts': [{ 'act': 'test' }, { 'act': '<<test' }, { 'act': '<<>>' }, { 'act': '<<act>>' }],
      'facts': [{ 'fact': 'test' }, { 'fact': '[test' }, { 'fact': '[]' }, { 'fact': '[fact]' }],
      'duties': [{ 'duty': 'test' }, { 'duty': '<test' }, { 'duty': '<>' }, { 'duty': '<duty>' }]
    })

    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors[0]).to.deep.equal({
      'code': 'LR0001',
      'source': 'test',
      'message': 'Invalid name for identifier',
      'offset': [168, 174],
      'path': [
        'duties',
        0,
        'duty'
      ],
      'severity': 'ERROR'
    })

    expect(errors.length).to.equal(12)
  })

  it('should find errors with duplicate identifiers', async () => {
    const model = JSON.stringify({
      'acts': [{ 'act': '<<act>>' }, { 'act': '<<test' }, { 'act': '<<atc>>' }, { 'act': '<<act>>' }, { 'act': '<<atc>>' }],
      'facts': [{ 'fact': 'test' }, { 'fact': '[test' }, { 'fact': '[]' }, { 'fact': '[fact]' }],
      'duties': [{ 'duty': 'test' }, { 'duty': '<test' }, { 'duty': '<>' }, { 'duty': '<duty>' }]
    })

    const modelValidator = new ModelValidator(model)

    const errors = modelValidator._findOverallDuplicateIdentifiers()

    expect(errors).to.deep.equal([
      {
        code: 'LR0003',
        message: 'Duplicate identifier',
        offset: [16, 25],
        severity: 'ERROR',
        source: '<<act>>',
        path: ['acts', 0, 'act']
      },
      {
        code: 'LR0003',
        message: 'Duplicate identifier',
        offset: [69, 78],
        severity: 'ERROR',
        source: '<<act>>',
        path: ['acts', 3, 'act']
      },
      {
        code: 'LR0003',
        message: 'Duplicate identifier',
        offset: [51, 60],
        severity: 'ERROR',
        source: '<<atc>>',
        path: ['acts', 2, 'act']
      },
      {
        code: 'LR0003',
        message: 'Duplicate identifier',
        offset: [87, 96],
        severity: 'ERROR',
        source: '<<atc>>',
        path: ['acts', 4, 'act']
      },
      {
        code: 'LR0003',
        message: 'Duplicate identifier',
        offset: [116, 122],
        severity: 'ERROR',
        source: 'test',
        path: ['facts', 0, 'fact']
      },
      {
        code: 'LR0003',
        message: 'Duplicate identifier',
        offset: [192, 198],
        severity: 'ERROR',
        source: 'test',
        path: ['duties', 0, 'duty']
      }
    ]
    )

    expect(errors.length).to.equal(6)
  })

  it('should find undefined facts used in acts', async () => {
    const model = JSON.stringify({
      'acts': [{ 'act': '<<act>>', 'actor': '[canary]', 'object': '[birdfood]', 'recipient': '[cat]' }],
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
          80,
          85
        ],
        'path': [
          'acts',
          0,
          'recipient'
        ],
        'severity': 'WARNING',
        'source': '[cat]'
      }
    ]
    )
  })

  it('should find undefined facts and duties used in acts in create and terminate', async () => {
    const model = JSON.stringify({
      'acts': [{ 'act': '<<act>>', 'create': ['[cats]', '<dogs>'], 'terminate': ['[sunshine]', '<rain>'] }],
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
          37,
          43
        ],
        'path': [
          'acts',
          0,
          'create',
          0
        ],
        'severity': 'WARNING',
        'source': '[cats]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          46,
          52
        ],
        'path': [
          'acts',
          0,
          'create',
          1
        ],
        'severity': 'WARNING',
        'source': '<dogs>'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          69,
          79
        ],
        'path': [
          'acts',
          0,
          'terminate',
          0
        ],
        'severity': 'WARNING',
        'source': '[sunshine]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          82,
          88
        ],
        'path': [
          'acts',
          0,
          'terminate',
          1
        ],
        'severity': 'WARNING',
        'source': '<rain>'
      }
    ]
    )
  })

  it('should find undefined facts used in acts in fact functions', async () => {
    const model = JSON.stringify({
      'acts': [],
      'facts': [{
        'fact': '[factname]',
        'function': {
          'expression': 'AND',
          'operands': [
            {
              'expression': 'OR',
              'operands': [
                '[cats]',
                '[dogs]'
              ]
            },
            '[sunshine]'
          ]
        }
      }],
      'duties': []
    })
    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors).to.deep.equal([
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          116,
          122
        ],
        'path': [
          'facts',
          0,
          'function',
          'operands',
          0,
          'operands',
          0
        ],
        'severity': 'WARNING',
        'source': '[cats]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          125,
          131
        ],
        'path': [
          'facts',
          0,
          'function',
          'operands',
          0,
          'operands',
          1
        ],
        'severity': 'WARNING',
        'source': '[dogs]'
      },
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          136,
          146
        ],
        'path': [
          'facts',
          0,
          'function',
          'operands',
          1
        ],
        'severity': 'WARNING',
        'source': '[sunshine]'
      }
    ]
    )
  })

  it('should find undefined facts used in lists', async () => {
    const model = JSON.stringify({
      'acts': [],
      'facts': [{
        'fact': '[factname]',
        'function': {
          'name': 'SomeList',
          'expression': 'LIST',
          'items': '[cats]'
        }
      }],
      'duties': []
    })
    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors).to.deep.equal([
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          100,
          106
        ],
        'path': [
          'facts',
          0,
          'function',
          'items'
        ],
        'severity': 'WARNING',
        'source': '[cats]'
      }
    ])
  })

  it('should yield warning for undefined fact in not expression', () => {
    const model = JSON.stringify({
      'acts': [],
      'facts': [
        {
          'fact': '[factname]',
          'function': {
            'name': 'SomeNot',
            'expression': 'NOT',
            'operand': '[aUndefinedFact]'
          }
        }
      ],
      'duties': []
    })

    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors).to.deep.equal([
      {
        'code': 'LR0002',
        'message': 'Undefined item',
        'offset': [
          100,
          116
        ],
        'path': [
          'facts',
          0,
          'function',
          'operand'
        ],
        'severity': 'WARNING',
        'source': '[aUndefinedFact]'
      }
    ])
  })

  it('should not yield undefined warning for literals', () => {
    const model = JSON.stringify({
      'acts': [],
      'facts': [
        {
          'fact': '[factname]',
          'function': {
            'expression': 'LITERAL',
            'operand': '5'
          }
        }
      ],
      'duties': []
    })

    const modelValidator = new ModelValidator(model)

    const errors = modelValidator.getDiagnostics()

    expect(errors).to.deep.equal([])
  })

  it('should find json validation errors when invalid json', () => {
    const model = `{"acts":[{"act":"<<congratulate>>", {}}],"facts":[],"duties":[{"duty":"<being nice>","terminate":"<<congratulate>>"}]}`

    const modelValidator = new ModelValidator(model)

    const diagnostics = modelValidator.getDiagnostics()

    expect(diagnostics).to.deep.equal([
      {
        'code': 'LR0004',
        'message': 'Property name expected',
        'offset': [
          36,
          37
        ],
        'path': undefined,
        'severity': 'ERROR',
        'source': undefined
      },
      {
        'code': 'LR0004',
        'message': 'Value expected',
        'offset': [
          37,
          38
        ],
        'path': undefined,
        'severity': 'ERROR',
        'source': undefined
      },
      {
        'code': 'LR0004',
        'message': 'Comma expected',
        'offset': [
          38,
          39
        ],
        'path': undefined,
        'severity': 'ERROR',
        'source': undefined
      },
      {
        'code': 'LR0004',
        'message': 'Value expected',
        'offset': [
          38,
          39
        ],
        'path': undefined,
        'severity': 'ERROR',
        'source': undefined
      }
    ])
  })

  it('should find undefined definition for offset when invalid json', () => {
    const model = `{"acts":[{"act":"<<congratulate>>", {}}],"facts":[],"duties":[{"duty":"<being nice>","terminate":"<<congratulate>>"}]}`

    const modelValidator = new ModelValidator(model)

    const definitionOffset = model.indexOf('<<congratulate>>')
    const referenceOffset = model.indexOf('<<congratulate>>', definitionOffset + 1)

    const congratulateDefinition = modelValidator.getDefinitionForOffset(referenceOffset + 6)
    expect(congratulateDefinition).to.equal(undefined)
  })

  it('should find no references for offset when invalid json', () => {
    const model = `{"acts":[{"act":"<<congratulate>>", {}}],"facts":[],"duties":[{"duty":"<being nice>","terminate":"<<congratulate>>"}]}`

    const modelValidator = new ModelValidator(model)

    const definitionOffset = model.indexOf('<<congratulate>>')
    const referenceOffset = model.indexOf('<<congratulate>>', definitionOffset + 1)

    const congratulateReference = modelValidator.getReferencesForOffset(referenceOffset + 5)
    expect(congratulateReference).to.deep.equal([])
  })

  it('should find no defintions for type when invalid json', () => {
    const model = `{"acts":[{"act":"<<congratulate>>", {}}],"facts":[],"duties":[{"duty":"<being nice>","terminate":"<<congratulate>>"}]}`

    const modelValidator = new ModelValidator(model)

    const acts = modelValidator.getDefinitionsForType('acts')
    expect(acts).to.deep.equal([])
  })

  it('should find no definition for invalid offset', () => {
    const modelValidator = new ModelValidator(sampleModelString)

    const definitionOffset = sampleModelString.length

    const congratulateReference = modelValidator.getDefinitionForOffset(definitionOffset + 5)
    expect(congratulateReference).to.equal(undefined)
  })

  it('should find no references for invalid offset', () => {
    const modelValidator = new ModelValidator(sampleModelString)

    const referenceOffset = sampleModelString.length

    const congratulateReference = modelValidator.getReferencesForOffset(referenceOffset + 5)
    expect(congratulateReference).to.deep.equal([])
  })
})
