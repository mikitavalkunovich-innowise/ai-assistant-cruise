import { NextResponse } from "next/server";
import { getOpenAI, CHAT_MODEL } from "@/lib/openai";
import { extractPdfText } from "@/lib/pdf/extract-pdf-text";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const schemaRaw = formData.get("schema") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!schemaRaw) {
      return NextResponse.json({ error: "No JSON schema provided" }, { status: 400 });
    }

    let schema: unknown;
    try {
      schema = JSON.parse(schemaRaw);
    } catch {
      return NextResponse.json({ error: "Invalid JSON schema — check syntax" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let pdfText = "";
    let ocrUsed = false;
    try {
      const result = await extractPdfText(buffer);
      pdfText = result.text;
      ocrUsed = result.ocrUsed;
    } catch {
      return NextResponse.json(
        { error: "Failed to parse PDF. Make sure the file is not password-protected." },
        { status: 422 }
      );
    }

    if (!pdfText) {
      return NextResponse.json(
        { error: "No readable text found in PDF after OCR." },
        { status: 422 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const openai = getOpenAI();

    const systemPrompt = `You are a precise data-extraction assistant. 
The user will provide text from a PDF and a JSON template showing which fields to extract.

Your task:
1. Read the PDF text carefully.
2. Extract the values for every field defined in the JSON template.
3. Return ONLY a valid JSON object that matches the structure of the provided template.
4. If a field cannot be found, use null for strings/objects or an empty array [] for array fields.
5. Do not add extra fields not present in the template.
6. Preserve the exact structure, nesting, and array patterns shown in the template.
7. Numbers should be numbers (not strings), dates as strings in ISO 8601 format when possible.`;

    const userPrompt = `JSON TEMPLATE (structure to extract into):
${JSON.stringify(schema, null, 2)}

PDF TEXT:
${pdfText.slice(0, 24000)}

Return a JSON object matching the template structure with values extracted from the PDF text.`;

    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_tokens: 4096,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";

    let extracted: unknown;
    try {
      extracted = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Model returned invalid JSON", raw }, { status: 500 });
    }

    return NextResponse.json({
      extracted,
      meta: {
        pdfChars: pdfText.length,
        ocrUsed,
        model: CHAT_MODEL,
        tokensUsed: response.usage?.total_tokens ?? null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
