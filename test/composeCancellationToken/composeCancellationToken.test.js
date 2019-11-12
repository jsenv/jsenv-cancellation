import { assert } from "@dmail/assert"
import {
  createCancellationSource,
  createCancellationToken,
  composeCancellationToken,
} from "../../index.js"

{
  const cancellationSource = createCancellationSource()
  const cancellationSourceToken = cancellationSource.token
  const cancellationToken = createCancellationToken()
  const compositeCancellationToken = composeCancellationToken(
    cancellationToken,
    cancellationSourceToken,
  )
  cancellationSource.cancel()

  const actual = compositeCancellationToken.cancellationRequested
  const expected = true
  assert({ actual, expected })
}
