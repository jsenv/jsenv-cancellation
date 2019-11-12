import { assert } from "/node_modules/@dmail/assert/index.js"
import { createConcurrentOperations } from "../../../index.js"
import { registerProcessExitCallback } from "../registerProcessExitCallback.js"

const error = new Error("here")
let startedCount = 0

registerProcessExitCallback(({ exceptionArray }) => {
  assert({ actual: startedCount, expected: 4 })
  assert({ actual: exceptionArray, expected: [{ exception: error, origin: "uncaughtException" }] })
  process.exitCode = 0
})

createConcurrentOperations({
  array: ["a", "b", "c", "d"],
  maxParallelExecution: 2,
  start: (value) => {
    startedCount++
    if (value === "c") throw error
  },
})
