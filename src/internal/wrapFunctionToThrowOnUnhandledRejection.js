export const wrapFunctionToThrowOnUnhandledRejection = (fn) => async (...args) => {
  const uninstall = installUnhandledRejectionStrict()
  try {
    const value = await fn(...args)
    uninstall()
    return value
  } catch (e) {
    // don't remove it immediatly to let nodejs emit the unhandled rejection
    setTimeout(() => {
      uninstall()
    })
    throw e
  }
}

const installUnhandledRejectionStrict = () => {
  const unhandledRejectionArg = getCommandArgument(process.execArgv, "--unhandled-rejections")
  if (unhandledRejectionArg === "strict") {
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
