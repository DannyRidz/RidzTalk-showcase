import { describe, expect, it, vi } from "vitest";
import { RealtimeTranslationRequestQueue } from "./realtimeTranslationRequest";

const turn = (itemId = "malay-1", text = "Saya baik, terima kasih.") => ({ itemId, text, instructions: "Translate English and Malay literally." });

describe("transcript based realtime translation", () => {
  it("uses only the finalized displayed transcript as the response input", () => {
    const send = vi.fn();
    const queue = new RealtimeTranslationRequestQueue();
    queue.enqueue(turn(), send);
    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      type: "response.create",
      response: {
        conversation: "none", metadata: { source_item_id: "malay-1" },
        instructions: turn().instructions, output_modalities: ["audio"],
        input: [{ type: "message", role: "user", content: [{ type: "input_text", text: turn().text }] }],
      },
    }));
  });

  it("ignores empty transcripts and repeated completion for the same source", () => {
    const send = vi.fn(); const queue = new RealtimeTranslationRequestQueue();
    queue.enqueue(turn("empty", " "), send);
    queue.enqueue(turn(), send); queue.enqueue(turn(), send);
    queue.handleEvent({ type: "response.done" }, send);
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("serializes finalized turns and keeps their source identities", () => {
    const send = vi.fn(); const queue = new RealtimeTranslationRequestQueue();
    queue.enqueue(turn(), send); queue.enqueue(turn("english-2", "Hello, how are you?"), send);
    expect(send).toHaveBeenCalledTimes(1);
    queue.handleEvent({ type: "response.done" }, send);
    expect(send.mock.calls[1][0].response.metadata.source_item_id).toBe("english-2");
  });

  it("releases a rejected request without confusing unrelated server errors", () => {
    const send = vi.fn(); const queue = new RealtimeTranslationRequestQueue();
    queue.enqueue(turn(), send); queue.enqueue(turn("next"), send);
    queue.handleEvent({ type: "error", error: { event_id: "unrelated" } }, send);
    expect(send).toHaveBeenCalledTimes(1);
    queue.handleEvent({ type: "error", error: { event_id: send.mock.calls[0][0].event_id } }, send);
    expect(send).toHaveBeenCalledTimes(2);
  });
});


describe("spoken turn ordering", () => {
  it("waits for the first committed turn when the second transcript finishes first", () => {
    const send = vi.fn(); const queue = new RealtimeTranslationRequestQueue();
    queue.handleEvent({ type: "input_audio_buffer.committed", item_id: "first" }, send);
    queue.handleEvent({ type: "input_audio_buffer.committed", item_id: "second", previous_item_id: "first" }, send);
    queue.enqueue(turn("second", "Second sentence"), send);
    expect(send).not.toHaveBeenCalled();
    queue.enqueue(turn("first", "First sentence"), send);
    expect(send.mock.calls[0][0].response.metadata.source_item_id).toBe("first");
    queue.handleEvent({ type: "response.done" }, send);
    expect(send.mock.calls[1][0].response.metadata.source_item_id).toBe("second");
  });

  it.each([
    { type: "conversation.item.input_audio_transcription.completed", transcript: "" },
    { type: "conversation.item.input_audio_transcription.failed" },
    { type: "conversation.item.deleted" },
  ])("advances past an empty, failed or deleted earlier turn ($type)", event => {
    const send = vi.fn(); const queue = new RealtimeTranslationRequestQueue();
    queue.handleEvent({ type: "input_audio_buffer.committed", item_id: "first" }, send);
    queue.handleEvent({ type: "input_audio_buffer.committed", item_id: "second" }, send);
    queue.enqueue(turn("second"), send);
    expect(send).not.toHaveBeenCalled();
    queue.handleEvent({ ...event, item_id: "first" }, send);
    expect(send.mock.calls[0][0].response.metadata.source_item_id).toBe("second");
  });

  it("does not reserve the same committed source twice", () => {
    const send = vi.fn(); const queue = new RealtimeTranslationRequestQueue();
    queue.handleEvent({ type: "input_audio_buffer.committed", item_id: "first" }, send);
    queue.handleEvent({ type: "input_audio_buffer.committed", item_id: "first" }, send);
    queue.enqueue(turn("first"), send);
    queue.handleEvent({ type: "response.done" }, send);
    queue.enqueue(turn("second"), send);
    expect(send.mock.calls.map(call => call[0].response.metadata.source_item_id)).toEqual(["first", "second"]);
  });
});
