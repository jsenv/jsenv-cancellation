import { createCancellationSource } from "./createCancellationSource.js"

export const createCancellationTokenForProcessSIGINT = () => {
  const SIGINTCancelSource = createCancellationSource()
  process.on("SIGINT", () => SIGINTCancelSource.cancel("process interruption"))
  return SIGINTCancelSource.token
}
