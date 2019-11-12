export const composeCancellationToken = (...tokens) => {
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
