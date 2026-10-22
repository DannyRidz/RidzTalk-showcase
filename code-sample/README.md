# Translation turn ordering sample

This is an isolated copy of the translation queue and its regression tests from RidzTalk, extracted on 22 October 2026. It is application source, not a simulated implementation. It has no React, Supabase, native plugin, microphone, or API dependencies.

## Run

Use Node.js 20 or newer. From this directory:

```sh
npm install
npm test
npm run typecheck
```

Direct development dependency versions are fixed in `package.json`. No lockfile is included, so transitive resolution can vary. `private: true` prevents accidental npm publication; it does not prevent sharing the code on GitHub.

## Read

Start with [the queue](src/realtimeTranslationRequest.ts), then [the tests](src/realtimeTranslationRequest.test.ts).

Suppose turn A is committed before turn B, but B's transcript finishes first. A queue based only on final transcript arrival would send B before A. This implementation reserves positions in an ordered Map on commit events and fills them as final transcripts arrive. Only one response request is active at a time.

Each request translates the finalized displayed transcript with isolated text input. Source metadata keeps the request associated with its conversation entry. Duplicate source IDs are ignored. Empty, failed, and deleted source items release their positions. A matching request error releases the active request; unrelated errors do not.

The tests exercise input isolation, duplicate and empty finalization, serialization, correlated error handling, reversed transcript completion order, terminal skips, and duplicate commits. They make no external requests and do not measure translation accuracy or audible latency.

## Boundaries

The owning recording hook replaces the queue when a session stops. That lifecycle code is outside this extract. Events without prior commits fall back to transcript arrival order. A reserved turn without a final or terminal event can block the queue because this class has no timeout. `response.done` assumes the surrounding session contains only the translation responses this queue owns; broader response multiplexing would need response identity checks.

This is a focused review sample, not an OpenAI SDK or a complete standalone translator. The event names and request schema reflect the inspected application revision. A future provider schema change may require changes in the production integration.
