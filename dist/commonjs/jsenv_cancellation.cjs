'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var nodeSignals = require('@jsenv/node-signals');

const createCancellationToken = () => {
  const register = callback => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`);
    }

    return {
      callback,
      unregister: () => {}
    };
  };

  const throwIfRequested = () => undefined;

  return {
    register,
    cancellationRequested: false,
    throwIfRequested
  };
};

const memoizeOnce = compute => {
  let locked = false;
  let lockValue;

  const memoized = (...args) => {
    if (locked) return lockValue; // if compute is recursive wait for it to be fully done before storing the lockValue
    // so set locked later

    lockValue = compute(...args);
    locked = true;
    return lockValue;
  };

  memoized.deleteCache = () => {
    const value = lockValue;
    locked = false;
    lockValue = undefined;
    return value;
  };

  return memoized;
};

const createAbortableOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  abort,
  ...rest
}) => {
  if (typeof abort !== "function") {
    throw new TypeError(`abort must be a function, got ${abort}`);
  }

  const unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error(`createAbortableOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start
abort`);
  }

  cancellationToken.throwIfRequested();
  const promise = new Promise(resolve => {
    resolve(start());
  });
  const cancelPromise = new Promise((resolve, reject) => {
    const cancelRegistration = cancellationToken.register(cancelError => {
      cancelRegistration.unregister();
      reject(cancelError);
    });
    promise.then(cancelRegistration.unregister, () => {});
  });
  const operationPromise = Promise.race([promise, cancelPromise]);
  const abortInternal = memoizeOnce(abort);
  const abortRegistration = cancellationToken.register(abortInternal);
  promise.then(abortRegistration.unregister, () => {});
  operationPromise.abort = abortInternal;
  return operationPromise;
};

const createOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  ...rest
}) => {
  const unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error(`createOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start`);
  }

  cancellationToken.throwIfRequested();
  const promise = new Promise(resolve => {
    resolve(start());
  });
  const cancelPromise = new Promise((resolve, reject) => {
    const cancelRegistration = cancellationToken.register(cancelError => {
      cancelRegistration.unregister();
      reject(cancelError);
    });
    promise.then(cancelRegistration.unregister, () => {});
  });
  const operationPromise = Promise.race([promise, cancelPromise]);
  return operationPromise;
};

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
const createConcurrentOperations = async ({
  cancellationToken = createCancellationToken(),
  concurrencyLimit = 5,
  array,
  start,
  ...rest
}) => {
  if (typeof concurrencyLimit !== "number") {
    throw new TypeError(`concurrencyLimit must be a number, got ${concurrencyLimit}`);
  }

  if (concurrencyLimit < 1) {
    throw new Error(`concurrencyLimit must be 1 or more, got ${concurrencyLimit}`);
  }

  if (typeof array !== "object") {
    throw new TypeError(`array must be an array, got ${array}`);
  }

  if (typeof start !== "function") {
    throw new TypeError(`start must be a function, got ${start}`);
  }

  const unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error(`createConcurrentOperations called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
concurrencyLimit
array
start`);
  }

  const outputArray = [];
  let progressionIndex = 0;
  let remainingExecutionCount = array.length;

  const nextChunk = async () => {
    await createOperation({
      cancellationToken,
      start: async () => {
        const outputPromiseArray = [];

        while (remainingExecutionCount > 0 && outputPromiseArray.length < concurrencyLimit) {
          remainingExecutionCount--;
          const outputPromise = executeOne(progressionIndex);
          progressionIndex++;
          outputPromiseArray.push(outputPromise);
        }

        if (outputPromiseArray.length) {
          await Promise.all(outputPromiseArray);

          if (remainingExecutionCount > 0) {
            await nextChunk();
          }
        }
      }
    });
  };

  const executeOne = async index => {
    return createOperation({
      cancellationToken,
      start: async () => {
        const input = array[index];
        const output = await start(input);
        outputArray[index] = output;
      }
    });
  };

  await nextChunk();
  return outputArray;
};

const createOperationSequence = async ({
  cancellationToken = createCancellationToken(),
  array,
  start
}) => {
  const results = [];
  await array.reduce((previous, value) => {
    return createOperation({
      cancellationToken,
      start: async () => {
        await previous;
        const result = await start(value);
        results.push(result);
      }
    });
  }, Promise.resolve());
  return results;
};

const createStoppableOperation = ({
  cancellationToken = createCancellationToken(),
  start,
  stop,
  ...rest
}) => {
  if (typeof stop !== "function") {
    throw new TypeError(`stop must be a function. got ${stop}`);
  }

  const unknownArgumentNames = Object.keys(rest);

  if (unknownArgumentNames.length) {
    throw new Error(`createStoppableOperation called with unknown argument names.
--- unknown argument names ---
${unknownArgumentNames}
--- possible argument names ---
cancellationToken
start
stop`);
  }

  cancellationToken.throwIfRequested();
  const promise = new Promise(resolve => {
    resolve(start());
  });
  const cancelPromise = new Promise((resolve, reject) => {
    const cancelRegistration = cancellationToken.register(cancelError => {
      cancelRegistration.unregister();
      reject(cancelError);
    });
    promise.then(cancelRegistration.unregister, () => {});
  });
  const operationPromise = Promise.race([promise, cancelPromise]);
  const stopInternal = memoizeOnce(async reason => {
    const value = await promise;
    return stop(value, reason);
  });
  cancellationToken.register(stopInternal);
  operationPromise.stop = stopInternal;
  return operationPromise;
};

const firstOperationMatching = ({
  array,
  start,
  predicate
}) => {
  if (typeof array !== "object") {
    throw new TypeError(`array must be an object, got ${array}`);
  }

  if (typeof start !== "function") {
    throw new TypeError(`start must be a function, got ${start}`);
  }

  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`);
  }

  const visit = async index => {
    if (index >= array.length) {
      return undefined;
    }

    const input = array[index];
    const output = await start(input);

    if (predicate(output)) {
      return output;
    }

    return visit(index + 1);
  };

  return visit(0);
};

const createCancelError = reason => {
  const cancelError = new Error(`canceled because ${reason}`);
  cancelError.name = "CANCEL_ERROR";
  cancelError.reason = reason;
  return cancelError;
};
const isCancelError = value => {
  return value && typeof value === "object" && value.name === "CANCEL_ERROR";
};
const errorToCancelReason = error => {
  if (!isCancelError(error)) return "";
  return error.reason;
};

const composeCancellationToken = (...tokens) => {
  const register = callback => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`);
    }

    const registrationArray = [];

    const visit = i => {
      const token = tokens[i];
      const registration = token.register(callback);
      registrationArray.push(registration);
    };

    let i = 0;

    while (i < tokens.length) {
      visit(i++);
    }

    const compositeRegistration = {
      callback,
      unregister: () => {
        registrationArray.forEach(registration => registration.unregister());
        registrationArray.length = 0;
      }
    };
    return compositeRegistration;
  };

  let requested = false;
  let cancelError;
  const internalRegistration = register(parentCancelError => {
    requested = true;
    cancelError = parentCancelError;
    internalRegistration.unregister();
  });

  const throwIfRequested = () => {
    if (requested) {
      throw cancelError;
    }
  };

  return {
    register,

    get cancellationRequested() {
      return requested;
    },

    throwIfRequested
  };
};

const arrayWithout = (array, item) => {
  const arrayWithoutItem = [];
  let i = 0;

  while (i < array.length) {
    const value = array[i];
    i++;

    if (value === item) {
      continue;
    }

    arrayWithoutItem.push(value);
  }

  return arrayWithoutItem;
};

// https://github.com/tc39/proposal-cancellation/tree/master/stage0
const createCancellationSource = () => {
  let requested = false;
  let cancelError;
  let registrationArray = [];

  const cancel = reason => {
    if (requested) return;
    requested = true;
    cancelError = createCancelError(reason);
    const registrationArrayCopy = registrationArray.slice();
    registrationArray.length = 0;
    registrationArrayCopy.forEach(registration => {
      registration.callback(cancelError); // const removedDuringCall = registrationArray.indexOf(registration) === -1
    });
  };

  const register = callback => {
    if (typeof callback !== "function") {
      throw new Error(`callback must be a function, got ${callback}`);
    }

    const existingRegistration = registrationArray.find(registration => {
      return registration.callback === callback;
    }); // don't register twice

    if (existingRegistration) {
      return existingRegistration;
    }

    const registration = {
      callback,
      unregister: () => {
        registrationArray = arrayWithout(registrationArray, registration);
      }
    };
    registrationArray = [registration, ...registrationArray];
    return registration;
  };

  const throwIfRequested = () => {
    if (requested) {
      throw cancelError;
    }
  };

  return {
    token: {
      register,

      get cancellationRequested() {
        return requested;
      },

      throwIfRequested
    },
    cancel
  };
};

const createCancellationTokenForProcess = () => {
  const teardownCancelSource = createCancellationSource();
  nodeSignals.teardownSignal.addCallback(reason => teardownCancelSource.cancel(`process ${reason}`));
  return teardownCancelSource.token;
};

const wrapFunctionToCatchCancellation = asyncFunction => async (...args) => {
  try {
    const value = await asyncFunction(...args);
    return value;
  } catch (error) {
    if (isCancelError(error)) {
      // it means consume of the function will resolve with a cancelError
      // but when you cancel it means you're not interested in the result anymore
      // thanks to this it avoid unhandledRejection
      return error;
    }

    throw error;
  }
};

const wrapFunctionToConsiderUnhandledRejectionsAsExceptions = fn => async (...args) => {
  const uninstall = installUnhandledRejectionMode();

  try {
    const value = await fn(...args);
    return value;
  } finally {
    // don't remove it immediatly to let nodejs emit the unhandled rejection
    setTimeout(() => {
      uninstall();
    });
  }
};

const installUnhandledRejectionMode = () => {
  const unhandledRejectionArg = getCommandArgument(process.execArgv, "--unhandled-rejections");

  if (unhandledRejectionArg === "strict") {
    return () => {};
  }

  if (unhandledRejectionArg === "throw") {
    return () => {};
  }

  const onUnhandledRejection = reason => {
    throw reason;
  };

  process.once("unhandledRejection", onUnhandledRejection);
  return () => {
    process.removeListener("unhandledRejection", onUnhandledRejection);
  };
};

const getCommandArgument = (argv, name) => {
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];

    if (arg === name) {
      return {
        name,
        index: i,
        value: ""
      };
    }

    if (arg.startsWith(`${name}=`)) {
      return {
        name,
        index: i,
        value: arg.slice(`${name}=`.length)
      };
    }

    i++;
  }

  return null;
};

const executeAsyncFunction = (fn, {
  catchCancellation = false,
  considerUnhandledRejectionsAsExceptions = false
} = {}) => {
  if (catchCancellation) {
    fn = wrapFunctionToCatchCancellation(fn);
  }

  if (considerUnhandledRejectionsAsExceptions) {
    fn = wrapFunctionToConsiderUnhandledRejectionsAsExceptions(fn);
  }

  return fn();
};

exports.composeCancellationToken = composeCancellationToken;
exports.createAbortableOperation = createAbortableOperation;
exports.createCancelError = createCancelError;
exports.createCancellationSource = createCancellationSource;
exports.createCancellationToken = createCancellationToken;
exports.createCancellationTokenForProcess = createCancellationTokenForProcess;
exports.createConcurrentOperations = createConcurrentOperations;
exports.createOperation = createOperation;
exports.createOperationSequence = createOperationSequence;
exports.createStoppableOperation = createStoppableOperation;
exports.errorToCancelReason = errorToCancelReason;
exports.executeAsyncFunction = executeAsyncFunction;
exports.firstOperationMatching = firstOperationMatching;
exports.isCancelError = isCancelError;

//# sourceMappingURL=jsenv_cancellation.cjs.map