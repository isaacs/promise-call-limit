import * as os from 'node:os'
// availableParallelism available only since node v19, for older versions use
// cpus() cpus() can return an empty list if /proc is not mounted, use 1 in
// this case

/* c8 ignore start */
const defLimit =
  'availableParallelism' in os ?
    Math.max(1, os.availableParallelism() - 1)
  : Math.max(1, (os as typeof import('node:os')).cpus().length - 1)
/* c8 ignore stop */

export type Step<T> = () => Promise<T>

export type Options = {
  limit?: number
  rejectLate?: boolean
}

export const callLimit = <T extends any>(
  queue: Step<T>[],
  { limit = defLimit, rejectLate }: Options = {},
) =>
  new Promise((res, rej) => {
    let active = 0
    let current = 0
    const results: (T | void | Promise<void | T>)[] = []

    // Whether or not we rejected, distinct from the rejection just in case the rejection itself is falsey
    let rejected = false
    let rejection: unknown
    const reject = (er?: unknown) => {
      if (rejected) return
      rejected = true
      rejection ??= er
      if (!rejectLate) rej(rejection)
    }

    let resolved = false
    const resolve = () => {
      if (resolved || active > 0) return
      resolved = true
      res(results)
    }

    const run = () => {
      const c = current++
      if (c >= queue.length) return rejected ? reject() : resolve()

      active++
      const step = queue[c]
      /* c8 ignore start */
      if (!step) throw new Error('walked off queue')
      /* c8 ignore stop */

      results[c] = step()
        .then(
          result => {
            active--
            results[c] = result
            return result
          },
          er => {
            active--
            reject(er)
          },
        )
        .then(result => {
          if (rejected && active === 0) return rej(rejection)
          run()
          return result
        })
    }

    for (let i = 0; i < limit; i++) run()
  })
