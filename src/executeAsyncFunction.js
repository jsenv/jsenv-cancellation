import { wrapFunctionToCatchCancellation } from "./internal/wrapFunctionToCatchCancellation.js"
import { wrapFunctionToConsiderUnhandledRejectionsAsExceptions } from "./internal/wrapFunctionToConsiderUnhandledRejectionsAsExceptions.js"

export const executeAsyncFunction = (
  fn,
  { catchCancellation = false, considerUnhandledRejectionsAsExceptions = false } = {},
) => {
  if (catchCancellation) {
    fn = wrapFunctionToCatchCancellation(fn)
  }

  if (considerUnhandledRejectionsAsExceptions) {
    fn = wrapFunctionToConsiderUnhandledRejectionsAsExceptions(fn)
  }

  return fn()
}
