/* eslint-env mocha */
/* eslint-disable no-unused-expressions */
import { expect } from 'chai'

import { BigUtil } from './../src/big_util'
import * as log from 'loglevel'
import Big from 'big.js'
log.getLogger('disciplLawReg').setLevel('warn')

describe('big_util.js', () => {
  it('should add two normal numbers', () => {
    expect(BigUtil.add(1, 2)).to.equal(3)
  })

  it('should add undefined and result in undefined', () => {
    expect(BigUtil.add(undefined, 2)).to.be.undefined
  })

  it('should add a number and a big number', () => {
    expect(BigUtil.add(1, Big(2))).to.deep.equal(Big(3))
  })

  it('should add a big number and a number', () => {
    expect(BigUtil.add(Big(1), 2)).to.deep.equal(Big(3))
  })

  it('should multiply two normal numbers', () => {
    expect(BigUtil.multiply(2, 3)).to.equal(6)
  })

  it('should multiply a number and a big number', () => {
    expect(BigUtil.multiply(2, Big(3))).to.deep.equal(Big(6))
  })

  it('should multiply a big number and a number', () => {
    expect(BigUtil.multiply(Big(2), 3)).to.deep.equal(Big(6))
  })

  it('should compare equality two normal numbers', () => {
    expect(BigUtil.equal(2, 2)).to.equal(true)
  })

  it('should compare equality a number and a big number', () => {
    expect(BigUtil.equal(2, Big(2))).to.equal(true)
  })

  it('should compare equality a big number and a number', () => {
    expect(BigUtil.equal(Big(2), 2)).to.equal(true)
  })

  it('should compare with less-than two normal numbers', () => {
    expect(BigUtil.lessThan(1, 2)).to.equal(true)
  })

  it('should compare with less-than a number and a big number', () => {
    expect(BigUtil.lessThan(1, Big(2))).to.equal(true)
  })

  it('should compare with less-than a big number and a number', () => {
    expect(BigUtil.lessThan(Big(1), 2)).to.equal(true)
  })
})
