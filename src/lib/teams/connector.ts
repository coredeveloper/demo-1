/*
 * Bot Connector REST helpers — replies and streamed responses.
 *
 * Replies are separate outbound POSTs to the activity's serviceUrl (never the
 * HTTP response body), which is what lets /api/messages ack within Teams'
 * 10–15 s window and keep working via waitUntil().
 *
 * Streaming (GA, 1:1 personal chats only): `typing` activities carrying
 * streaminfo entities with cumulative text, ≥1 s apart, closed by a final
 * `message` activity — hard cap 2 minutes end-to-end. Channels fall back to a
 * single plain message.
 */
import { connectorToken } from "./token";

type Activity = Record<string, unknown>;

const STREAM_THROTTLE_MS = 1200;

export async function sendActivity(
  serviceUrl: string,
  conversationId: string,
  activity: Activity,
): Promise<string | undefined> {
  const token = await connectorToken();
  const url = `${serviceUrl.replace(/\/+$/, "")}/v3/conversations/${encodeURIComponent(
    conversationId,
  )}/activities`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(activity),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`sendActivity failed (${res.status}): ${detail.slice(0, 300)}`);
  }
  const json = (await res.json().catch(() => ({}))) as { id?: string };
  return json.id;
}

/** Charts are a web-surface feature — strip any fence the model emits anyway. */
export function stripChartFences(text: string): string {
  return text
    .replace(/```chart[\s\S]*?```/g, "_(chart available on the dashboard)_")
    .trim();
}

export class TeamsStreamer {
  private seq = 1;
  private streamId: string | undefined;
  private lastSentAt = 0;
  private sending = false;

  constructor(
    private serviceUrl: string,
    private conversationId: string,
    private personal: boolean,
  ) {}

  /** Throttled cumulative-text streaming update (personal chats only). */
  async update(cumulativeText: string): Promise<void> {
    if (!this.personal || this.sending) return;
    const now = Date.now();
    if (now - this.lastSentAt < STREAM_THROTTLE_MS) return;
    this.sending = true;
    this.lastSentAt = now;
    try {
      const id = await sendActivity(this.serviceUrl, this.conversationId, {
        type: "typing",
        text: cumulativeText,
        entities: [
          {
            type: "streaminfo",
            streamType: "streaming",
            streamSequence: this.seq++,
            ...(this.streamId ? { streamId: this.streamId } : {}),
          },
        ],
      });
      if (!this.streamId && id) this.streamId = id;
    } catch (e) {
      // Streaming is best-effort — the final message still lands.
      console.error("teams stream update failed:", e);
    } finally {
      this.sending = false;
    }
  }

  /** Send the final message (closes the stream when one was opened). */
  async finish(finalText: string): Promise<void> {
    const text = finalText || "_(no response)_";
    if (this.personal && this.streamId) {
      await sendActivity(this.serviceUrl, this.conversationId, {
        type: "message",
        text,
        entities: [
          { type: "streaminfo", streamType: "final", streamId: this.streamId },
        ],
      });
      return;
    }
    await sendActivity(this.serviceUrl, this.conversationId, {
      type: "message",
      text,
    });
  }
}
