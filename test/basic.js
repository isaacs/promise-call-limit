const t = require('tap')
const callLimit = require('../')

t.test('two by two', t => {
  let calledOne = false
  let calledTwo = false
  let calledTre = false
  return callLimit([
    () => new Promise(res => setTimeout(() => {
      t.equal(calledOne, false)
      t.equal(calledTwo, true)
      t.equal(calledTre, true)
      calledOne = true
      res(1)
    }, 200)),
    () => new Promise(res => setTimeout(() => {
      t.equal(calledOne, false)
      t.equal(calledTwo, false)
      t.equal(calledTre, false)
      calledTwo = true
      res(2)
    }, 100)),
    () => new Promise(res => setTimeout(() => {
      t.equal(calledOne, false)
      t.equal(calledTwo, true)
      t.equal(calledTre, false)
      calledTre = true
      res(3)
    }, 50)),
  ], 2).then(res => t.strictSame(res, [1, 2, 3]))
})

t.test('rejection', t => t.rejects(callLimit([
  () => Promise.reject(new Error('poop')),
]), { message: 'poop' }))

t.test('triple rejection', t => t.rejects(callLimit([
  () => Promise.reject(new Error('poop')),
  () => Promise.reject(new Error('poop')),
  () => Promise.reject(new Error('poop')),
]), { message: 'poop' }))
