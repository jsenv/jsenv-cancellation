// https://github.com/tc39/proposal-cancellation/tree/master/stage0
import { arrayWithout } from "./internal/arrayHelper.js"
import { createCancelError } from "./cancelError.js"

export const createCancellationSource = () => {
  let requested = false
  let cancelError
  let registrationArray = []
  const cancel = (reason) => {
    if (requested) return
    requested = true
    cancelError = createCancelError(reason)

    const registrationArrayCopy = registrationArray.slice()
    registrationArray.length = 0
    registrationArrayCopy.forEach((registration) => {
      registration.callback(cancelError)
      // const removedDuringCall = registrationArray.indexOf(registration) === -1
    })
  }

  const register = (callback) => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`)
    }

    const existingRegistration = registrationArray.find((registration) => {
      return registration.callback === callback
    })
    // don't register twice
    if (existingRegistration) {
      return existingRegistration
    }

    const registration = {
      callback,
      unregister: () => {
        registrationArray = arrayWithout(registrationArray, registration)
      },
    }
    registrationArray = [registration, ...registrationArray]

    return registration
  }

  const throwIfRequested = () => {
    if (requested) {
      throw cancelError
    }
  }

  return {
    token: {
      register,
      get cancellationRequested() {
        return requested
      },
      throwIfRequested,
    },
    cancel,
  }
}
