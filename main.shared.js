// operation are built on top of cancellation API
// for the sake of simplicity they are inside the same repo
// but conceptually they should not
export { createAbortableOperation } from "./src/operation/createAbortableOperation.js"
export { createConcurrentOperations } from "./src/operation/createConcurrentOperations.js"
export { createOperation } from "./src/operation/createOperation.js"
export { createOperationSequence } from "./src/operation/createOperationSequence.js"
export { createStoppableOperation } from "./src/operation/createStoppableOperation.js"
export { firstOperationMatching } from "./src/operation/firstOperationMatching.js"

// cancellation API
export { createCancelError, isCancelError, errorToCancelReason } from "./src/cancelError.js"
export { composeCancellationToken } from "./src/composeCancellationToken.js"
export { createCancellationSource } from "./src/createCancellationSource.js"
export { createCancellationToken } from "./src/createCancellationToken.js"
