// ==================== Messenger Send API ====================
// Helpers for sending messages back to Facebook Messenger

const GRAPH_API = "https://graph.facebook.com/v19.0";

export interface MessengerProfile {
  first_name?: string;
  last_name?: string;
  profile_pic?: string;
}

/**
 * Send a text message to a Messenger user via the Page Send API.
 */
export async function sendTextMessage(recipientId: string, text: string): Promise<boolean> {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) {
    console.error("[Messenger] FB_PAGE_ACCESS_TOKEN is not set");
    return false;
  }

  try {
    const res = await fetch(`${GRAPH_API}/me/messages?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
        messaging_type: "RESPONSE",
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error("[Messenger] Send failed:", JSON.stringify(err));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[Messenger] Network error:", err);
    return false;
  }
}

/**
 * Send a typing indicator (typing_on or typing_off).
 */
export async function sendTypingIndicator(recipientId: string, action: "typing_on" | "typing_off" = "typing_on"): Promise<void> {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) return;

  try {
    await fetch(`${GRAPH_API}/me/messages?access_token=${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recipient: { id: recipientId },
        sender_action: action,
      }),
    });
  } catch {
    // Typing indicator is best-effort, don't throw
  }
}

/**
 * Get a user's profile info from Messenger.
 */
export async function getUserProfile(userId: string): Promise<MessengerProfile | null> {
  const token = process.env.FB_PAGE_ACCESS_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(
      `${GRAPH_API}/${userId}?fields=first_name,last_name,profile_pic&access_token=${token}`
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
