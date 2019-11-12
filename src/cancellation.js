// https://github.com/tc39/proposal-cancellation/tree/master/stage0
import { arrayWithout } from "./arrayHelper.js"

export const createCancelError = (reason) => {
  const cancelError = new Error(`canceled because ${reason}`)
  cancelError.name = "CANCEL_ERROR"
  cancelError.reason = reason
  return cancelError
}

export const isCancelError = (value) => {
  return value && typeof value === "object" && value.name === "CANCEL_ERROR"
}

export const errorToCancelReason = (error) => {
  if (!isCancelError(error)) return ""
  return error.reason
}

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

export const cancellationTokenCompose = (...tokens) => {
  const register = (callback) => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`)
    }

    const registrationArray = []

    const visit = (i) => {
      const token = tokens[i]
      const registration = token.register(callback)
      registrationArray.push(registration)
    }
    let i = 0
    while (i < tokens.length) {
      visit(i++)
    }

    const compositeRegistration = {
      callback,
      unregister: () => {
        registrationArray.forEach((registration) => registration.unregister())
        registrationArray.length = 0
      },
    }

    return compositeRegistration
  }

  let requested = false
  let cancelError
  const internalRegistration = register((parentCancelError) => {
    requested = true
    cancelError = parentCancelError
    internalRegistration.unregister()
  })

  const throwIfRequested = () => {
    if (requested) {
      throw cancelError
    }
  }

  return {
    register,
    get cancellationRequested() {
      return requested
    },
    throwIfRequested,
  }
}

export const createCancellationToken = () => {
  const register = (callback) => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`)
    }

    return {
      callback,
      unregister: () => {},
    }
  }

  const throwIfRequested = () => undefined

  return {
    register,
    cancellationRequested: false,
    throwIfRequested,
  }
}
