import { assert } from "@jsenv/assert"
import {
  createCancellationSource,
  createCancellationToken,
  composeCancellationToken,
} from "@jsenv/cancellation"

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
