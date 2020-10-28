import { wrapFunctionToCatchCancellation } from "./internal/wrapFunctionToCatchCancellation.js"
import { wrapFunctionToThrowOnUnhandledRejection } from "./internal/wrapFunctionToThrowOnUnhandledRejection.js"

export const executeAsyncFunction = (
  fn,
  { catchCancellation = false, unhandledRejectionStrict = false } = {},
) => {
  if (catchCancellation) {
    fn = wrapFunctionToCatchCancellation(fn)
  }

  if (unhandledRejectionStrict) {
    fn = wrapFunctionToThrowOnUnhandledRejection(fn)
  }

  return fn()
}
