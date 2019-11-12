import { createCancellationToken } from "../createCancellationToken.js"
import { memoizeOnce } from "../internal/memoizeOnce.js"

export const createAbortableOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  abort,
  ...rest
}) => {
  if (typeof abort !== "function") {
    throw new TypeError(`abort must be a function, got ${abort}`)
  }
  const unknownArgumentNames = Object.keys(rest)
  if (unknownArgumentNames.length) {
    throw new Error(`createAbortableOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start
abort`)
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

  const abortInternal = memoizeOnce(abort)
  const abortRegistration = cancellationToken.register(abortInternal)
  promise.then(abortRegistration.unregister, () => {})
  operationPromise.abort = abortInternal

  return operationPromise
}
