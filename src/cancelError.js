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
