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
            offset: [ 16, 25 ],
            severity: 'ERROR',
            source: '<<act>>',
            path: [ 'acts', 0, 'act' ]
          },
          {
            code: 'LR0003',
            message: 'Duplicate identifier',
            offset: [ 69, 78 ],
            severity: 'ERROR',
            source: '<<act>>',
            path: [ 'acts', 3, 'act' ]
          },
          {
            code: 'LR0003',
            message: 'Duplicate identifier',
            offset: [ 51, 60 ],
            severity: 'ERROR',
            source: '<<atc>>',
            path: [ 'acts', 2, 'act' ]
          },
          {
            code: 'LR0003',
            message: 'Duplicate identifier',
            offset: [ 87, 96 ],
            severity: 'ERROR',
            source: '<<atc>>',
            path: [ 'acts', 4, 'act' ]
          },
          {
            code: 'LR0003',
            message: 'Duplicate identifier',
            offset: [ 116, 122 ],
            severity: 'ERROR',
            source: 'test',
            path: [ 'facts', 0, 'fact' ]
          },
          {
            code: 'LR0003',
            message: 'Duplicate identifier',
            offset: [ 192, 198 ],
            severity: 'ERROR',
            source: 'test',
            path: [ 'duties', 0, 'duty' ]
          }
        ]
    )

    expect(errors.length).to.equal(6)
  })
})
