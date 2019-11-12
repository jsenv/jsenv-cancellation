import { isCancelError } from "./cancelError.js"

export const catchAsyncFunctionCancellation = (asyncFunction) => {
  return asyncFunction().catch((error) => {
    if (isCancelError(error)) return
    throw error
  })
}
