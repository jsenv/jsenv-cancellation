import { assert } from "@jsenv/assert"
import { createCancellationSource, errorToCancelReason } from "../../index.js"
import { startServer, requestServer } from "./fixtures.js"

{
  const { token: cancellationToken, cancel } = createCancellationSource()

  try {
    cancel("reason")

    const portPromise = startServer({ cancellationToken })
    const port = await portPromise
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
}
