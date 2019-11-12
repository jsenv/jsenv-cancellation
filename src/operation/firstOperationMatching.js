export const firstOperationMatching = ({ array, start, predicate }) => {
  if (typeof array !== "object") {
    throw new TypeError(`array must be an object, got ${array}`)
  }
  if (typeof start !== "function") {
    throw new TypeError(`start must be a function, got ${start}`)
  }
  if (typeof predicate !== "function") {
    throw new TypeError(`predicate must be a function, got ${predicate}`)
  }

  return new Promise((resolve, reject) => {
    const visit = (index) => {
      if (index >= array.length) {
        return resolve()
      }
      const input = array[index]
      const returnValue = start(input)
      return Promise.resolve(returnValue).then((output) => {
        if (predicate(output)) {
          return resolve(output)
        }
        return visit(index + 1)
      }, reject)
    }

    visit(0)
  })
}
