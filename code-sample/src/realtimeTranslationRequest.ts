interface TranslationTurn {
  itemId: string;
  text: string;
  instructions: string;
}

interface TranslationRequest {
  type: "response.create";
  event_id: string;
  response: {
    conversation: "none";
    metadata: { source_item_id: string };
    instructions: string;
    output_modalities: ["audio"];
    input: Array<{
      type: "message";
      role: "user";
      content: Array<{ type: "input_text"; text: string }>;
    }>;
  };
}

type SendRequest = (request: TranslationRequest) => void;

/** Translate the displayed transcript, not a second interpretation of its audio.
 * Explicit input also excludes previous AI replies from the next translation.
 */
export class RealtimeTranslationRequestQueue {
  private seen = new Set<string>();
  // Data channel commit events reserve spoken order before asynchronous finals.
  private pending = new Map<string, TranslationTurn | undefined>();
  private activeEventId: string | undefined;
  private sequence = 0;

  enqueue(turn: TranslationTurn, send: SendRequest) {
    if (this.seen.has(turn.itemId)) return;
    if (!turn.text.trim()) {
      this.skip(turn.itemId, send);
      return;
    }
    this.seen.add(turn.itemId);
    // Updating a reserved Map entry preserves its original insertion order.
    // Legacy events without commits retain completion order as a fallback.
    this.pending.set(turn.itemId, turn);
    this.flush(send);
  }

  handleEvent(event: {
    type?: string;
    item_id?: string;
    previous_item_id?: string | null;
    transcript?: string;
    error?: { event_id?: string };
  }, send: SendRequest) {
    if (event.type === "input_audio_buffer.committed" && event.item_id) {
      if (!this.seen.has(event.item_id) && !this.pending.has(event.item_id)) {
        this.pending.set(event.item_id, undefined);
      }
      return;
    }
    const isEmptyCompletion = (
      event.type === "conversation.item.input_audio_transcription.completed" ||
      event.type === "session.input_transcript.done" ||
      event.type === "session.input_transcript.completed"
    ) && typeof event.transcript === "string" && !event.transcript.trim();
    if (event.item_id && (isEmptyCompletion ||
      event.type === "conversation.item.input_audio_transcription.failed" ||
      event.type === "conversation.item.deleted")) {
      this.skip(event.item_id, send);
      return;
    }
    if (event.type === "response.done" ||
      (event.type === "error" && this.activeEventId && event.error?.event_id === this.activeEventId)) {
      this.activeEventId = undefined;
      this.flush(send);
    }
  }

  private skip(itemId: string, send: SendRequest) {
    this.seen.add(itemId);
    this.pending.delete(itemId);
    this.flush(send);
  }

  private flush(send: SendRequest) {
    if (this.activeEventId) return;
    const first = this.pending.entries().next().value;
    if (!first) return;
    const [itemId, turn] = first;
    if (!turn) return;

    this.activeEventId = `translation-${++this.sequence}`;
    try {
      send({
        type: "response.create",
        event_id: this.activeEventId,
        response: {
          conversation: "none",
          metadata: { source_item_id: turn.itemId },
          instructions: turn.instructions,
          output_modalities: ["audio"],
          input: [{ type: "message", role: "user", content: [{ type: "input_text", text: turn.text }] }],
        },
      });
      this.pending.delete(itemId);
    } catch (error) {
      this.activeEventId = undefined;
      this.seen.delete(turn.itemId);
      throw error;
    }
  }
}
