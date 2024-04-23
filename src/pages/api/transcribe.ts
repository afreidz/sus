import OpenAI from "openai";
import type { APIRoute } from "astro";

export type transcription = {
  POST: {};
};

export const POST: APIRoute = async ({ request }) => {
  const client = new OpenAI({ apiKey: import.meta.env.OPENAI_API_KEY });
  const data = await request.formData();
  const formFile = data.get("audio");

  if (!formFile)
    return new Response(JSON.stringify({ message: "no file found" }), {
      status: 400,
    });

  const file = new File([formFile], "audio.webm", { type: "audio/webm" });

  const resp = await client.audio.transcriptions.create({
    file,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  return new Response(JSON.stringify(resp), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
