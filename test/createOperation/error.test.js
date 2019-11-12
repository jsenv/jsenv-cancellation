import { assert } from "@dmail/assert"
import { exitSignal } from "@jsenv/node-signals"
import { createOperation } from "../../index.js"

const error = new Error("here")
exitSignal.addCallback(
  ({ exceptionArray }) => {
    const actual = exceptionArray
    const expected = [{ exception: error, origin: "uncaughtException" }]
    assert({ actual, expected })
    process.exitCode = 0
  },
  { collectExceptions: true },
)

createOperation({
  start: () => {
    throw error
  },
})
