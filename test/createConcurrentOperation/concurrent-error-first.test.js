import { assert } from "@jsenv/assert"
import { exitSignal } from "@jsenv/node-signals"
import { createConcurrentOperations } from "@jsenv/cancellation"

const error = new Error("here")
let startedCount = 0

exitSignal.addCallback(
  ({ exceptionArray }) => {
    {
      const actual = startedCount
      const expected = 2
      assert({ actual, expected })
    }
    {
      const actual = exceptionArray
      const expected = [{ exception: error, origin: "uncaughtException" }]
      assert({ actual, expected })
    }
    process.exitCode = 0
  },
  { collectExceptions: true },
)

createConcurrentOperations({
  array: ["a", "b", "c", "d"],
  concurrencyLimit: 2,
  start: () => {
    startedCount++
    throw error
  },
})
