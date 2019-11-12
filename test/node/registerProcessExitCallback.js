export const registerProcessExitCallback = (callback) => {
  let exceptionArray = []

  const unhandledRejectionCallback = (unhandledRejection, promise) => {
    exceptionArray = [
      ...exceptionArray,
      { origin: "unhandledRejection", exception: unhandledRejection, promise },
    ]
  }

  const rejectionHandledCallback = (promise) => {
    exceptionArray = exceptionArray.filter((exceptionArray) => exceptionArray.promise !== promise)
  }

  const uncaughtExceptionCallback = (uncaughtException) => {
    exceptionArray = [
      ...exceptionArray,
      { origin: "uncaughtException", exception: uncaughtException },
    ]
  }

  const exitCallback = () => {
    process.removeListener("exit", exitCallback)
    process.removeListener("unhandledRejection", unhandledRejectionCallback)
    process.removeListener("rejectionHandled", rejectionHandledCallback)
    process.removeListener("uncaughtException", uncaughtExceptionCallback)
    callback({
      exceptionArray: exceptionArray.map(({ exception, origin }) => {
        return { exception, origin }
      }),
    })
  }

  process.on("unhandledRejection", unhandledRejectionCallback)
  process.on("rejectionHandled", rejectionHandledCallback)
  process.on("uncaughtException", uncaughtExceptionCallback)
  process.on("exit", exitCallback)

  return () => {
    process.removeListener("exit", exitCallback)
    process.removeListener("unhandledRejection", unhandledRejectionCallback)
    process.removeListener("rejectionHandled", rejectionHandledCallback)
    process.removeListener("uncaughtException", uncaughtExceptionCallback)
  }
}
