const API_URL = process.env.NEXT_PUBLIC_AI_API_URL;

export async function sendMessage(message: string) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      lesson_id: "default",
      request_type: "explain",
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to fetch AI response");
  }

  return res.json(); // { reply: string }
}
export async function fetchSpeech(text: string) {
  const res = await fetch("http://127.0.0.1:8000/talk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: text,
      lesson_id: "intro",
      request_type: "explain",
    }),
  });

  if (!res.ok) {
    throw new Error("TTS failed");
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob); // 🔥 this is the key
}