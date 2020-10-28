import { teardownSignal } from "@jsenv/node-signals"
import { createCancellationSource } from "./createCancellationSource.js"

export const createCancellationTokenForProcess = () => {
  const teardownCancelSource = createCancellationSource()
  teardownSignal.addCallback((reason) => teardownCancelSource.cancel(`process ${reason}`))
  return teardownCancelSource.token
}
