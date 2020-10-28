import { assert } from "@jsenv/assert"
import { exitSignal } from "@jsenv/node-signals"
import { createConcurrentOperations } from "@jsenv/cancellation"

exitSignal.addCallback(
  ({ exceptionArray: actual }) => {
    const expected = []
    assert({ actual, expected })
  },
  { collectExceptions: true },
)

const actual = await createConcurrentOperations({
  array: ["a", "b", "c", "d"],
  concurrencyLimit: 2,
  start: (value) => Promise.resolve(value),
})
const expected = ["a", "b", "c", "d"]
assert({ actual, expected })
