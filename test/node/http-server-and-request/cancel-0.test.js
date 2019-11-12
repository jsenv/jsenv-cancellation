import { assert } from "/node_modules/@dmail/assert/index.js"
import { createCancellationSource, isCancelError } from "../../../index.js"
import { startServer, requestServer } from "./fixtures.js"

{
  const { token: cancellationToken, cancel } = createCancellationSource()

  try {
    cancel("cancel")

    const portPromise = startServer({ cancellationToken })
    const port = await portPromise
    const responsePromise = requestServer({ cancellationToken, port })
    const response = await responsePromise
    assert({ actual: response.statusCode, expected: 200 })
  } catch (error) {
    assert({ actual: isCancelError(error), expected: true })
  }
}
