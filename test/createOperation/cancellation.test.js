import { assert } from "@jsenv/assert"
import { createCancellationSource, createOperation, errorToCancelReason } from "@jsenv/cancellation"

const { token, cancel } = createCancellationSource()

const operation = createOperation({
  cancellationToken: token,
  start: () => new Promise(() => {}),
})

setTimeout(() => cancel(42), 10)

try {
  await operation
  throw new Error("should throw a cancel error")
} catch (error) {
  const actual = errorToCancelReason(error)
  const expected = 42
  assert({ actual, expected })
}
