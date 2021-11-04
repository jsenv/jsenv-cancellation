> ARCHIVED: Replaced by https://github.com/jsenv/abort

# cancellation

Make async function cancellable.

[![npm package](https://img.shields.io/npm/v/@jsenv/cancellation.svg?logo=npm&label=package)](https://www.npmjs.com/package/@jsenv/cancellation)
[![github main workflow](https://github.com/jsenv/jsenv-cancellation/workflows/main/badge.svg)](https://github.com/jsenv/jsenv-cancellation/actions?workflow=main)
[![codecov coverage](https://codecov.io/gh/jsenv/jsenv-cancellation/branch/master/graph/badge.svg)](https://codecov.io/gh/jsenv/jsenv-cancellation)

# Presentation

`@jsenv/cancellation` provides a pattern to make your code cancellable. It is an implementation of [cancellation API proposal](https://github.com/tc39/proposal-cancellation/tree/master/stage0) that does not provide 100% of the proposal.

The documentation is incomplete and lacks some example to show how it is meant to be used. You can check [test/server-request/fixtures.js](./test/server-request/fixtures.js) to see a code example.

# Installation

```console
npm install @jsenv/cancellation
```

# createCancellationSource

```js
import { createCancellationSource } from "@jsenv/cancellation"

const cancellationSource = createCancellationSource
const cancellationToken = cancellationSource.token

process.on("SIGINT", () => {
  cancellationSource.cancel("process SIGINT")
})

cancellationToken.register(() => {
  // do stuff because cancellation is requested (by process SIGINT)
})

// at any point, throwIfRequested() throw a cancellation error if cancellation is requested (by process SIGINT)
cancellationToken.throwIfRequested()
```

# executeAsyncFunction

`executeAsyncFunction` receives a function, calls it immediatly, awaiting its return value. By default it's equivalent to calling the async function yourself but it can becomes different when using [catchCancellation](#catchCancellation) or [considerUnhandledRejectionsAsExceptions](#considerUnhandledRejectionsAsExceptions).

```js
import { executeAsyncFunction } from "@jsenv/cancellation"

const value = await executeAsyncFunction(async () => {
  return "Hello"
})
console.log(value)
```

```console
Hello
```

— source code at [src/executeAsyncFunction.js](./src/executeAsyncFunction.js).

## catchCancellation

It is a boolean which is false by default. When enabled any cancellation error thrown during the function execution is catched and returned.

By default when a function is cancelled it throws a cancel error. Use `catchCancellation` to avoid the cancellation error to terminates Node.js process with exit code 1.

_Without catchCancellation_

```js
import { createCancellationSource, executeAsyncFunction } from "@jsenv/cancellation"

await executeAsyncFunction(
  async () => {
    const cancelSource = createCancellationSource()
    const cancellationToken = cancelSource.token

    cancelSource.cancel()
    cancellationToken.throwIfRequested()
  },
  {
    catchCancellation: false,
  },
)
console.log("Hello")
```

```console
> node --experimental-top-level-await file.js
CANCEL_ERROR: canceled because toto
```

_With catchCancellation_

```js
import { createCancellationSource, executeAsyncFunction } from "@jsenv/cancellation"

await executeAsyncFunction(
  async () => {
    const cancelSource = createCancellationSource()
    const cancellationToken = cancelSource.token

    cancelSource.cancel()
    cancellationToken.throwIfRequested()
  },
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
import { createCancellationSource, executeAsyncFunction, isCancelError } from "@jsenv/cancellation"

const result = await executeAsyncFunction(
  () => {
    const cancelSource = createCancellationSource()
    const cancellationToken = cancelSource.token

    cancelSource.cancel()
    cancellationToken.throwIfRequested()
  },
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

_When considerUnhandledRejectionsAsExceptions is disabled_

```js
import { executeAsyncFunction } from "@jsenv/cancellation"

const fn = async () => {
  Promise.reject(new Error("toto"))
}

await executeAsyncFunction(fn)
```

```console
> node --experimental-top-level-await file.js
(node:58618) UnhandledPromiseRejectionWarning: Error: toto
```

_When considerUnhandledRejectionsAsExceptions is enabled_

```js
import { executeAsyncFunction } from "@jsenv/cancellation"

const fn = async () => {
  Promise.reject(new Error("toto"))
}

await executeAsyncFunction(fn, {
  considerUnhandledRejectionsAsExceptions: true,
})
```

```console
> node --experimental-top-level-await file.js
Error: toto
```

— See [Node.js documentation about unhandled rejections](https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode)
