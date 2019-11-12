import { createCancellationToken } from "./cancellation.js"
import { memoizeOnce } from "./memoizeOnce.js"

export const createStoppableOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  stop,
  ...rest
}) => {
  if (typeof stop !== "function")
    throw new TypeError(`createStoppableOperation expect a stop function. got ${stop}`)
  ensureExactParameters(rest)
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

const ensureExactParameters = (extraParameters) => {
  const extraParamNames = Object.keys(extraParameters)
  if (extraParamNames.length)
    throw new Error(`createOperation expect only cancellationToken, start. Got ${extraParamNames}`)
}
