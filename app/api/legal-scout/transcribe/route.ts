import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;

    if (!audio) {
      return NextResponse.json({ error: "No audio provided" }, { status: 400 });
    }

    const openai = getOpenAI();
    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: undefined,
    });

    return NextResponse.json({ text: transcription.text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
