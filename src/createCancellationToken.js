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
