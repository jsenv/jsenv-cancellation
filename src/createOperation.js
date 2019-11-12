import { createCancellationToken } from "./cancellation.js"

export const createOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  ...rest
}) => {
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

  return operationPromise
}

const ensureExactParameters = (extraParameters) => {
  const extraParamNames = Object.keys(extraParameters)
  if (extraParamNames.length)
    throw new Error(`createOperation expect only cancellationToken, start. Got ${extraParamNames}`)
}
