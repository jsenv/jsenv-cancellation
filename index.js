// operation are built on top of cancellation API
// for the sake of simplicity they are inside the same repo
// but conceptually they should not
export { createAbortableOperation } from "./src/operation/createAbortableOperation.js"
export { createConcurrentOperations } from "./src/operation/createConcurrentOperations.js"
export { createOperation } from "./src/operation/createOperation.js"
export { createOperationSequence } from "./src/operation/createOperationSequence.js"
export { createStoppableOperation } from "./src/operation/createStoppableOperation.js"

// cancellation API
export { createCancelError, isCancelError, errorToCancelReason } from "./src/cancelError.js"
export { composeCancellationToken } from "./src/composeCancellationToken.js"
export { createCancellationSource } from "./src/createCancellationSource.js"
export { createCancellationToken } from "./src/createCancellationToken.js"

// a useful helper to avoid throwing on cancellation
export { catchAsyncFunctionCancellation } from "./src/catchAsyncFunctionCancellation.js"
// should not be here but its simpler to provide directlry this useful helper
export {
  createCancellationTokenForProcessSIGINT,
} from "./src/createCancellationTokenForProcessSIGINT.js"
