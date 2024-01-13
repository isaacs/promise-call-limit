import t from 'tap'
import { callLimit } from '../src/index.js'

t.test('two by two', async t => {
  let calledOne = false
  let calledTwo = false
  let calledTre = false
  return await callLimit(
    [
      () =>
        new Promise(res =>
          setTimeout(() => {
            t.equal(calledOne, false)
            t.equal(calledTwo, true)
            t.equal(calledTre, true)
            calledOne = true
            res(1)
          }, 200),
        ),
      () =>
        new Promise(res =>
          setTimeout(() => {
            t.equal(calledOne, false)
            t.equal(calledTwo, false)
            t.equal(calledTre, false)
            calledTwo = true
            res(2)
          }, 100),
        ),
      () =>
        new Promise(res =>
          setTimeout(() => {
            t.equal(calledOne, false)
            t.equal(calledTwo, true)
            t.equal(calledTre, false)
            calledTre = true
            res(3)
          }, 50),
        ),
    ],
    { limit: 2 },
  ).then(res => t.strictSame(res, [1, 2, 3]))
})

t.test('rejection', t =>
  t.rejects(callLimit([() => Promise.reject(new Error('poop'))]), {
    message: 'poop',
  }),
)

t.test('triple rejection', t =>
  t.rejects(
    callLimit([
      () => Promise.reject(new Error('poop')),
      () => Promise.reject(new Error('poop')),
      () => Promise.reject(new Error('poop')),
    ]),
    { message: 'poop' },
  ),
)

t.test('late rejection', async t => {
  const results: any[] = []
  await t.rejects(
    callLimit(
      [
        () =>
          new Promise(resolve =>
            setTimeout(() => {
              results.push('first success')
              resolve('ok')
            }, 50),
          ),
        () =>
          new Promise((_, reject) => {
            setTimeout(() => {
              results.push('slow rejection')
              reject(new Error('slow rejection'))
            }, 100)
          }),
        () => {
          results.push('fast rejection')
          return Promise.reject(new Error('fast rejection'))
        },
        () =>
          new Promise(resolve =>
            setTimeout(() => {
              results.push('second success')
              resolve('ok 2')
            }, 50),
          ),
      ],
      { limit: 2, rejectLate: true },
    ),
    { message: 'fast rejection' },
  )
  t.match(results, [
    'first success',
    'fast rejection',
    'slow rejection',
    'second success',
  ])
})
