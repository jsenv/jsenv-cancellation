import { assert } from "@jsenv/assert"
import { createCancellationSource, errorToCancelReason } from "@jsenv/cancellation"
import { startServer, requestServer } from "./fixtures.js"

const { token: cancellationToken, cancel } = createCancellationSource()

try {
  const portPromise = startServer({ cancellationToken })
  const port = await portPromise

  cancel("reason")

  const responsePromise = requestServer({ cancellationToken, port })
  const response = await responsePromise
  const actual = response.statusCode
  const expected = 200
  assert({ actual, expected })
} catch (error) {
  const actual = errorToCancelReason(error)
  const expected = "reason"
  assert({ actual, expected })
}
