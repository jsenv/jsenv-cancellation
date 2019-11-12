import { assert } from "/node_modules/@dmail/assert/index.js"
import { createConcurrentOperations } from "../../../index.js"
import { registerProcessExitCallback } from "../registerProcessExitCallback.js"

registerProcessExitCallback(({ exceptionArray }) => {
  assert({ actual: exceptionArray, expected: [] })
})

const resultArray = await createConcurrentOperations({
  array: ["a", "b", "c", "d"],
  maxParallelExecution: 2,
  start: (value) => Promise.resolve(value),
})
assert({ actual: resultArray, expected: ["a", "b", "c", "d"] })
