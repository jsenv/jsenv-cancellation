import { createCancellationToken } from "../createCancellationToken.js"
import { memoizeOnce } from "../internal/memoizeOnce.js"

export const createStoppableOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  stop,
  ...rest
}) => {
  if (typeof stop !== "function") {
    throw new TypeError(`stop must be a function. got ${stop}`)
  }
  const unknownArgumentNames = Object.keys(rest)
  if (unknownArgumentNames.length) {
    throw new Error(`createStoppableOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start
stop`)
  }
  cancellationToken.throwIfRequested()

  const promise = new Promise((resolve) => {
    resolve(start())
  })
  const cancelPromise = new Promise((resolve, reject) => {
    const cancelRegistration = cancellationToken.register((cancelError) => {
      cancelRegistration.unregister()
      reject(cancelError)
    })
    promise.then(cancelRegistration.unregister, () => {})
  })
  const operationPromise = Promise.race([promise, cancelPromise])

  const stopInternal = memoizeOnce(async (reason) => {
    const value = await promise
    return stop(value, reason)
  })
  cancellationToken.register(stopInternal)
  operationPromise.stop = stopInternal

  return operationPromise
}
