import http from "http"
import {
  createCancellationToken,
  createStoppableOperation,
  createAbortableOperation,
} from "../../../index.js"

export const startServer = async ({ cancellationToken = createCancellationToken() } = {}) => {
  cancellationToken.throwIfRequested()

  const server = http.createServer()

  const operation = createStoppableOperation({
    cancellationToken,
    start: () =>
      new Promise((resolve, reject) => {
        server.on("error", reject)
        server.on("listening", () => {
          resolve(server.address().port)
        })
        server.listen(0, "127.0.0.1")
      }),
    stop: (_, cancelError) =>
      new Promise((resolve, reject) => {
        server.once("close", (error) => {
          if (error) {
            reject(error)
          } else {
            resolve(`server closed because ${cancelError.reason}`)
          }
        })
        server.close()
      }),
  })

  process.on("exit", operation.stop)

  const port = await operation

  server.on("request", (request, response) => {
    response.writeHead(200)
    response.end()
  })

  return port
}

export const requestServer = async ({ cancellationToken = createCancellationToken(), port }) => {
  cancellationToken.throwIfRequested()

  const request = http.request({
    port,
    hostname: "127.0.0.1",
  })

  let aborting = false

  const operation = createAbortableOperation({
    cancellationToken,
    start: () =>
      new Promise((resolve, reject) => {
        request.on("response", resolve)
        request.on("error", (error) => {
          // abort may trigger a ECONNRESET error
          if (
            aborting &&
            error &&
            error.code === "ECONNRESET" &&
            error.message === "socket hang up"
          ) {
            return
          }
          reject(error)
        })
      }),
    abort: (cancelError) =>
      new Promise((resolve) => {
        aborting = true
        request.on("abort", () => {
          resolve(`request aborted because ${cancelError.reason}`)
        })
        request.abort()
      }),
  })

  request.end()

  return operation
}
