import { assert } from "@jsenv/assert"
import { createCancellationSource } from "../../index.js"
import { startServer, requestServer } from "./fixtures.js"

const { token: cancellationToken, cancel } = createCancellationSource()

try {
  const portPromise = startServer({ cancellationToken })
  const port = await portPromise
  const responsePromise = requestServer({ cancellationToken, port })
  const response = await responsePromise

  cancel("reason")

  const actual = response.statusCode
  const expected = 200
  assert({ actual, expected })
} catch (error) {
  assert({ actual: true, expected: false, message: "must no be called" })
}
