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

  const visit = async (index) => {
    if (index >= array.length) {
      return undefined
    }
    const input = array[index]
    const output = await start(input)
    if (predicate(output)) {
      return output
    }
    return visit(index + 1)
  }

  return visit(0)
}
