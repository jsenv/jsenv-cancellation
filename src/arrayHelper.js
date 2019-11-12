// TODO: externalize this into '@dmail/helper'
// import { arrayWithout } from '@dmail/helper'

export const arrayWithout = (array, item) => {
  const arrayWithoutItem = []
  let i = 0
  while (i < array.length) {
    const value = array[i]
    i++
    if (value === item) {
      continue
    }
    arrayWithoutItem.push(value)
  }
  return arrayWithoutItem
}
