export const wrapFunctionToConsiderUnhandledRejectionsAsExceptions = (fn) => async (...args) => {
  const uninstall = installUnhandledRejectionMode()
  try {
    const value = await fn(...args)
    return value
  } finally {
    // don't remove it immediatly to let nodejs emit the unhandled rejection
    setTimeout(() => {
      uninstall()
    })
  }
}

const installUnhandledRejectionMode = () => {
  const unhandledRejectionArg = getCommandArgument(process.execArgv, "--unhandled-rejections")
  if (unhandledRejectionArg === "strict") {
    return () => {}
  }
  if (unhandledRejectionArg === "throw") {
    return () => {}
  }

  const onUnhandledRejection = (reason) => {
    throw reason
  }
  process.once("unhandledRejection", onUnhandledRejection)
  return () => {
    process.removeListener("unhandledRejection", onUnhandledRejection)
  }
}

const getCommandArgument = (argv, name) => {
  let i = 0

  while (i < argv.length) {
    const arg = argv[i]

    if (arg === name) {
      return {
        name,
        index: i,
        value: "",
      }
    }

    if (arg.startsWith(`${name}=`)) {
      return {
        name,
        index: i,
        value: arg.slice(`${name}=`.length),
      }
    }

    i++
  }

  return null
}
