# cancellation

Make async function cancellable.

[![npm package](https://img.shields.io/npm/v/@jsenv/cancellation.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/cancellation)
[![github main workflow](https://github.com/jsenv/jsenv-cancellation/workflows/main/badge.svg)](https://github.com/jsenv/jsenv-cancellation/actions?workflow=main)
[![codecov coverage](https://codecov.io/gh/jsenv/jsenv-cancellation/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-cancellation)

# Presentation

`@jsenv/cancellation` provides a pattern to make your code cancellable. It is an implementation of [cancellation API proposal](https://github.com/tc39/proposal-cancellation/tree/master/stage0) that does not provide 100% of the proposal.

# Installation

```console
npm install @jsenv/cancellation
```

# createCancellationTokenForProcess

`createCancellationTokenForProcess` is a function returning a cancellation token cancelled just before process exits. Can be used to close a server before a process exists for instance.

```js
import { createCancellationTokenForProcess } from "@jsenv/util"
import { startServer } from "somewhere"

const cancellationToken = createCancellationTokenForProcess()
const server = await startServer()
cancellationToken.register(() => {
  server.stop()
})
```

— source code at [src/createCancellationTokenForProcess.js](./src/createCancellationTokenForProcess.js).

# executeAsyncFunction

`executeAsyncFunction` receives an async function and calls it immediatly. By default it won't do anything special but you can control what happens during the function execution using `catchCancellation` and `considerUnhandledRejectionsAsExceptions`.

— source code at [src/executeAsyncFunction.js](./src/executeAsyncFunction.js).

## catchCancellation

It is a boolean which is false by default. When enabled any cancellation error thrown during the function execution is catched and returned.

By default when a function is cancelled it throws a cancel error. Use `catchCancellation` to avoid the cancellation error to terminates Node.js process with exit code 1.

Without `catchCancellation`

```js
import { createCancellationSource } from "@jsenv/cancellation"

const fn = async ({ cancellationToken }) => {
  cancellationToken.throwIfRequested()
}

const cancelSource = createCancellationSource()
cancelSource.cancel()

await fn({
  cancellationToken: cancelSource.token,
})
console.log("Hello")
```

```console
> node --experimental-top-level-await file.js
CANCEL_ERROR: canceled because toto
```

With `catchCancellation`

```js
import { createCancellationSource, executeAsyncFunction } from "@jsenv/cancellation"

const fn = async ({ cancellationToken }) => {
  cancellationToken.throwIfRequested()
}

const cancelSource = createCancellationSource()
cancelSource.cancel("toto")

await executeAsyncFunction(
  () =>
    fn({
      cancellationToken: cancelSource.token,
    }),
  {
    catchCancellation: true,
  },
)
console.log("Hello")
```

```console
> node --experimental-top-level-await node.js
Hello
```

As you can see the cancellation error is ignored. You could use `isCancelError` to detect the cancellation like this:

```js
import { isCancelError, executeAsyncFunction } from "@jsenv/cancellation"

const result = await executeAsyncFunction(
  () =>
    fn({
      cancellationToken: cancelSource.token,
    }),
  {
    catchCancellation: true,
  },
)
if (isCancelError(result)) {
  console.log("cancelled")
}
```

But in practice cancellation means you are no longer interested in the result of the function execution. In my experience I never needed to do that.

## considerUnhandledRejectionsAsExceptions

It is a boolean which is false by default. When enabled, any unhandled rejection occuring during the function execution will throw the error and Node.js will exits with 1. This function is usefull in case Node.js was launched with unhandled rejection mode that is not `strict` but you want to force a strict behaviour during a function execution.

In other words any unexpected error ocurring during your function execution will throw even if Node.js process is not in strict mod regarding unhandled rejection.

Without `considerUnhandledRejectionsAsExceptions`

```js
const fn = async () => {
  Promise.reject(new Error("toto"))
}

await fn()
```

```console
> node --experimental-top-level-await file.js
(node:58618) UnhandledPromiseRejectionWarning: Error: toto
```

With `considerUnhandledRejectionsAsExceptions`

```js
import { executeAsyncFunction } from "@jsenv/cancellation"

const fn = async () => {
  Promise.reject(new Error("toto"))
}

await executeAsyncFunction(fn, { considerUnhandledRejectionsAsExceptions: true })
```

```console
> node --experimental-top-level-await file.js
Error: toto
```

— See [Node.js documentation about unhandled rejections](https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode)
