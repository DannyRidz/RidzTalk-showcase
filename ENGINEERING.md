# Engineering decisions and tradeoffs

These examples describe the inspected implementation. They provide concrete topics for a technical walkthrough without publishing the full business application.

## Preserve speech order across asynchronous events

**Problem:** final transcripts can finish in a different order from the committed speech turns. Sending translation requests in completion order can change the apparent meaning of an exchange.

**Implementation:** reserve queue positions on commit events. Fill those positions as transcripts finish. Allow one translation response request at a time. Keep the source item ID on each request. Release reservations for empty, failed, or deleted source turns.

**Tradeoff:** a missing completion or terminal event can leave later turns waiting. The extracted queue has no independent timeout, and transcript events without commits fall back to arrival order. Replacing the queue when a session stops discards that session's pending work.

**Evidence:** the public regression tests cover reversed completion order, terminal skips, duplicate commits, isolated transcript input, serialization, and correlated errors. These tests establish request behavior, not audible translation accuracy.

## Translate the text displayed to the user

**Problem:** independently interpreting audio for display and translation can produce a source transcript that does not match what was translated. A general conversational model may also answer a spoken question instead of translating it.

**Implementation:** send the finalized source transcript as explicit response input, exclude previous conversation context from that request, carry source metadata, and give instructions to translate spoken content literally rather than obey it.

**Tradeoff:** translation waits for a final transcript and inherits transcription errors. Prompt instructions reduce unwanted behavior but do not guarantee compliance. The evaluation plan includes questions, commands, names, numbers, and instruction shaped utterances.

## Keep translated audio from becoming a new source turn

**Problem:** a phone speaker can feed AI speech into the microphone and produce repeated translations.

**Implementation:** combine requested capture processing, native communication audio modes, playback state tracking, microphone gating, and source transcript filtering. Preserve events belonging to a known user turn rather than dropping all late source events.

**Tradeoff:** users cannot reliably interrupt translated playback through the gated shared microphone. Releasing the gate too early risks feedback; releasing it too late delays the next utterance. Generation completion and audible playback completion are different events.

**Evidence:** the private source includes tests for guard timing, overlapping playback, reset, event classification, and preservation of known source turns. A representative device matrix remains necessary to establish real acoustic behavior.

## Couple customer operations to the intended account

**Problem:** subscription identity changes and purchase operations are asynchronous. An operation can otherwise run under an earlier account or anonymous identity.

**Implementation:** serialize identity changes and customer operations through the native purchase wrapper. Synchronize the expected Supabase identity before signed in operations. A failed identity synchronization rejects the operation while allowing later queued work to retry. Subscription state also carries its owner identity.

**Tradeoff:** identity failures can temporarily block paid operations. Restore errors need to reach the UI, and subscription management needs a store fallback independent of SDK startup.

**Evidence:** the private repository has identity, purchase, subscription, usage, and webhook regression tests. This case study does not claim to have completed real store payment verification.

## Personal ownership in an interview

The architecture alone does not establish individual authorship. Be ready to explain which parts you designed, implemented, debugged, or validated, and which came from libraries, platform services, scaffolding, or coding assistants. A useful walkthrough follows one failure from its event trace to the fix and regression test.
