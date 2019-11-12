/*
We could pick from array like this

maxParallelExecution: 2
array: [a, b, c, d]

We could start [a,b]
And immediatly after a or b finish, start c
And immediatly after any finishes, start d

This approach try to maximize maxParallelExecution.
But it has one hidden disadvantage.

If the tasks can queue each other there is a chance that
a task gets constantly delayed by other started task
giving the false feeling that the task takes a long time
to be done.

To avoid this I prefer to start them chunk by chunk
so it means [a,b] and then [c,d] that will wait for a and b to complete

*/

import { createCancellationToken } from "./cancellation.js"
import { createOperation } from "./createOperation.js"

export const createConcurrentOperations = async ({
  cancellationToken = createCancellationToken(),
  maxParallelExecution = 5,
  array,
  start,
  ...rest
}) => {
  if (typeof maxParallelExecution !== "number")
    throw new TypeError(`maxParallelExecution must be a number, got ${maxParallelExecution}`)
  if (maxParallelExecution < 1)
    throw new Error(`maxParallelExecution must be 1 or more, got ${maxParallelExecution}`)
  if (typeof array !== "object") throw new TypeError(`array must be an array, got ${array}`)
  if (typeof start !== "function") throw new TypeError(`start must be a function, got ${start}`)
  if (Object.keys(rest).length) throw createExtraParameterError(rest)

  const outputArray = []
  let progressionIndex = 0
  let remainingExecutionCount = array.length

  const nextChunk = async () => {
    await createOperation({
      cancellationToken,
      start: async () => {
        const outputPromiseArray = []
        while (remainingExecutionCount > 0 && outputPromiseArray.length < maxParallelExecution) {
          remainingExecutionCount--
          const outputPromise = executeOne(progressionIndex)
          progressionIndex++
          outputPromiseArray.push(outputPromise)
        }

        if (outputPromiseArray.length) {
          await Promise.all(outputPromiseArray)
          if (remainingExecutionCount > 0) {
            await nextChunk()
          }
        }
      },
    })
  }

  const executeOne = async (index) => {
    return createOperation({
      cancellationToken,
      start: async () => {
        const input = array[index]
        const output = await start(input)
        outputArray[index] = output
      },
    })
  }

  await nextChunk()

  return outputArray
}

const createExtraParameterError = (extraParameter) => {
  return new Error(
    `only cancellationToken, maxParallelExecution, array, start expected. received ${Object.keys(
      extraParameter,
    )}`,
  )
}
