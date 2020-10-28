import { assert } from "@jsenv/assert"
import {
  createCancellationSource,
  createStoppableOperation,
  errorToCancelReason,
} from "@jsenv/cancellation"

const { token, cancel } = createCancellationSource()

let calledWith
const operation = createStoppableOperation({
  cancellationToken: token,
  start: async () => "start-awaited-return-value",
  stop: async (firstValue, cancelError) => {
    calledWith = [firstValue, errorToCancelReason(cancelError)]
  },
})

await operation
cancel(42)
await new Promise((resolve) => setTimeout(resolve))

const actual = calledWith
const expected = ["start-awaited-return-value", 42]
assert({ actual, expected })
