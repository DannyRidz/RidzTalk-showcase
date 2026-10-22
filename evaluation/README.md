# Speech translation evaluation

**Status: protocol prepared; no experiment results collected.** This folder is a reproducible recording plan, not a completed evaluation or an automatic scoring system.

## First experiment

Start with one language pair that a competent bilingual reviewer can assess. Record 60 utterances, balanced equally between directions. Use 10 utterances in each category: everyday phrases, questions, commands, names and numbers, mixed language speech, and instruction shaped content that should be translated rather than followed.

Run the same 60 recordings in quiet and in a documented background noise condition, producing 120 attempted turns. Keep an additional 20 utterances out of prompt and configuration tuning as a later holdout. Use consented adult speech or your own recordings. Synthetic references are test material, never presented as customer conversations.

Record the app version or source revision, model configuration, language direction, voice, device, OS, network, microphone route, noise procedure, and date in a run manifest. Give each configuration a distinct `run_id`. Do not compare configurations while silently changing devices or audio.

## Recording sheet

Copy [results-template.csv](results-template.csv) for each run. It contains headers only. Each row represents one attempted turn. Keep the same `utterance_id` for paired quiet and noisy attempts. Use `condition` to distinguish them.

| Field | Meaning |
| --- | --- |
| `source_reference` | Human checked source transcript |
| `source_hypothesis` | Transcript shown by the app |
| `translation_reference` | Bilingual reference, allowing valid alternative translations |
| `translation_hypothesis` | Translated text shown by the app |
| `speech_end_ms`, `first_audio_ms`, `terminal_ms` | Times relative to the same recording start or synchronized instrumentation clock |
| `outcome` | `success`, `timeout`, `missing_audio`, `wrong_direction`, or `error` |
| `meaning_score` | Human score 0 to 3, blank when not reviewed |
| `api_cost_usd`, `billed_session_seconds` | Attributed provider usage or billing evidence, blank if unavailable |

Choose a timeout before the run, for example 15 seconds from source speech end. Mark a timeout as failed even if audio eventually arrives. Record later recovery separately. Keep failures in the dataset. Do not estimate provider cost from a guessed price or treat missing cost as zero.

## Metrics

1. **Latency:** `first_audio_ms - speech_end_ms` for successful turns. Measure first audible translated output, not just a text event or a generated audio chunk. Report sample count, median, and p95 using nearest rank, `sorted[ceil(0.95 * n) - 1]`. Report failure and timeout counts beside latency so dropping failures cannot make the system appear faster.
2. **Transcription:** calculate word error rate as `(substitutions + deletions + insertions) / reference_words`. Aggregate edit counts and reference word counts across the corpus. Document text normalization, including punctuation, case, and numbers. For languages without suitable word boundaries, specify segmentation or report character error rate separately. Report empty reference cases separately.
3. **Translation meaning:** bilingual review, 3 = meaning preserved including key details, 2 = minor errors without a changed core meaning, 1 = substantial omission or changed meaning, 0 = wrong language, unrelated output, or no translation. Score failed outputs 0; leave unreviewed rows blank. Report the full distribution and reviewer coverage. A reference string is not the only valid translation.
4. **Reliability:** failed turns / all attempted turns. Break down timeouts, missing audio, wrong direction, and other errors. For a separate continuous session test, record duplicate turns, reversed order, and self translation from speaker feedback.
5. **Cost:** total attributed API cost / total measured session minutes. Define whether idle connected time is included. If costs are available only at session level, keep them in the manifest and calculate once per session; do not repeat the same cost on every row. Include failed attempts in total cost.

Use a second bilingual reviewer for at least 20% of outputs where available. Randomize output order and hide the configuration label during comparison. Record disagreements and their resolution. An LLM judge may assist triage, but its scores do not replace human language review.

## Separate device checks

After the recorded corpus, perform a live 10 turn exchange on each available physical device and audio route. Test phone speaker, headset, microphone denial, temporary network loss, foreground restore, and repeated stop/start. Record results separately from the recorded corpus. Browser event injection cannot establish acoustic or native routing behavior.

## Report template

| Measure | Baseline | Candidate |
| --- | --- | --- |
| Configuration and date | Not run | Not run |
| Attempted / successful turns | Not measured | Not measured |
| Median / p95 audio latency | Not measured | Not measured |
| Word or character error rate | Not measured | Not measured |
| Meaning score distribution / reviewer coverage | Not measured | Not measured |
| Failure rate by category | Not measured | Not measured |
| API cost per session minute | Not measured | Not measured |

Include the corpus definition, raw rows that are safe to share, environment, scoring procedure, three representative failures, any configuration changes, and limitations. Report paired comparisons on identical utterances. Do not describe a small initial corpus as a general language benchmark.
