import { assert } from "@jsenv/assert"
import { exitSignal } from "@jsenv/node-signals"
import { createAbortableOperation } from "@jsenv/cancellation"

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

createAbortableOperation({
  abort: () => {},
  start: () => {
    throw error
  },
})
