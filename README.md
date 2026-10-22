# RidzTalk

**A bilingual voice translation app, available on Google Play.**

RidzTalk helps two people speak across a language barrier: select two languages, speak into the microphone, read the transcript and translation, and hear the translated speech.

[Try RidzTalk on Google Play](https://play.google.com/store/apps/details?id=com.polytalk.app) · [Architecture](ARCHITECTURE.md) · [Engineering decisions](ENGINEERING.md) · [Run the code sample](code-sample/README.md) · [Evaluation methodology](evaluation/README.md)

Android is publicly available. The production application source is private because RidzTalk is a business project. This repository shares a technical case study and a focused source sample.

<p>
  <img src="assets/store-screenshot-1.jpg" width="166" alt="RidzTalk Google Play promotional image showing the microphone and language selectors">
  <img src="assets/store-screenshot-2.jpg" width="166" alt="RidzTalk Google Play promotional image showing voice selection">
</p>

Product images from the public Google Play listing, retrieved on 22 October 2026.

## Product and engineering scope

The application combines a React and TypeScript interface with Capacitor mobile projects, Supabase authentication and backend functions, OpenAI speech processing, RevenueCat subscription integration, and usage accounting.

The engineering work spans microphone capture, WebRTC session management, asynchronous transcript events, translated audio playback, conversation history, account changes, and paid access. OpenAI supplies the speech and language models. The application implements the surrounding product behavior and orchestration.

## A concrete engineering problem

Two people speak in order, but their final transcripts can arrive in the opposite order. Translating whichever transcript arrives first can reverse the conversation.

RidzTalk's translation queue reserves a position when each speech turn is committed, then fills that position when its transcript finishes. It sends the finalized source text as explicit translation input and carries its source identity into the response request. Empty, failed, and deleted turns release their positions.

The [TypeScript sample and regression tests](code-sample/README.md) reproduce this behavior without a microphone, API key, or access to the private app.

## What this project demonstrates

| Area | Evidence in this showcase |
| --- | --- |
| Application engineering | Mobile and backend architecture, asynchronous turn handling, account lifecycle decisions |
| AI application engineering | Explicit translation input, source identity tracking, speech feedback controls, evaluation design |
| Testing | Runnable tests covering transcript isolation, turn ordering, duplicate events, and error handling |
| Product delivery | Public Android listing, subscriptions and usage controls in the inspected implementation |

## Implementation and verification

RidzTalk is available on Google Play. The extracted translation queue passes nine regression tests and a TypeScript check. The [GitHub Actions workflow](https://github.com/DannyRidz/ridztalk-showcase/actions/runs/39772433235) independently passed installation, tests, and type checking.

The [evaluation methodology](evaluation/README.md) documents how to assess speech quality, latency, reliability, and API cost.

Live translation requires network services. Saved voice playback does not imply offline live translation. Microphone gating during translated speech intentionally limits interruption. The isolated sample focuses on translation request behavior.

## Source and release context

This case study describes source inspected on 22 October 2026. It does not claim every implementation detail is present in the current store binary. The [Google Play listing](https://play.google.com/store/apps/details?id=com.polytalk.app) establishes Android availability; it does not establish language accuracy or performance.
