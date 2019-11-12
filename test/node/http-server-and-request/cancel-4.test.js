import { assert } from "/node_modules/@dmail/assert/index.js"
import { createCancellationSource } from "../../../index.js"
import { startServer, requestServer } from "./fixtures.js"

const { token: cancellationToken, cancel } = createCancellationSource()

try {
  const portPromise = startServer({ cancellationToken })
  const port = await portPromise
  const responsePromise = requestServer({ cancellationToken, port })
  const response = await responsePromise

  cancel("cancel")

  assert({ actual: response.statusCode, expected: 200 })
} catch (error) {
  assert({ message: "must no be called", actual: true, expected: false })
}
