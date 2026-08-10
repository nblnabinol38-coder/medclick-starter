import { NextResponse } from "next/server";

import { readPatientSession } from "@/lib/server-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const REQUEST_TIMEOUT_MS = 25_000;

type Suggestion = {
  code: string;
  description: string;
  rationale: string;
};

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function collectOutputText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const parts: string[] = [];
  for (const item of payload.output ?? []) {
    for (const part of item.content ?? []) {
      if (part.type === "output_text" && typeof part.text === "string") {
        parts.push(part.text);
      }
    }
  }
  return parts.join("\n").trim();
}

function cleanCode(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function normalizeSuggestions(input: unknown): Suggestion[] {
  if (!Array.isArray(input)) return [];

  return input
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const code = typeof record.code === "string" ? cleanCode(record.code) : "";
      const description =
        typeof record.description === "string" ? record.description.trim() : "";
      const rationale =
        typeof record.rationale === "string" ? record.rationale.trim() : "";

      if (!code || !description || !rationale) return null;
      return { code, description, rationale };
    })
    .filter((item): item is Suggestion => Boolean(item))
    .slice(0, 4);
}

function friendlyOpenAIError(status: number) {
  if (status === 401) {
    return "A chave da IA não foi aceita. Confira OPENAI_API_KEY na Vercel e faça um novo deploy.";
  }
  if (status === 429) {
    return "A IA está sem cota disponível no momento. Confira o faturamento/créditos da API OpenAI.";
  }
  if (status === 404) {
    return "O modelo configurado para a IA não foi encontrado. Confira OPENAI_CID_MODEL.";
  }
  return "A IA não conseguiu analisar os sintomas agora. Tente novamente em alguns instantes.";
}

export async function POST(request: Request) {
  const session = await readPatientSession();

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Entre na sua conta para usar o assistente de CID." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { symptoms?: string };
  const symptoms = body.symptoms?.trim() ?? "";

  if (symptoms.length < 10) {
    return NextResponse.json(
      {
        success: false,
        message: "Descreva os principais sintomas com um pouco mais de detalhe para a IA analisar.",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_CID_MODEL?.trim() || "gpt-5-mini";

  if (!apiKey) {
    return NextResponse.json(
      {
        success: false,
        message: "Assistente ainda não configurado. Adicione OPENAI_API_KEY na Vercel e faça um novo deploy.",
      },
      { status: 503 },
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        instructions:
          "Você é um assistente de apoio à codificação clínica CID-10 para um portal de atendimento. Analise somente os sintomas fornecidos. Não faça diagnóstico definitivo e nunca diga que um código é certamente correto. Retorne de 1 a 4 opções de CID-10 possivelmente relacionadas ao relato, priorizando códigos de sinais/sintomas quando o relato não permitir uma doença específica. Cada opção deve ter código, descrição curta em português e uma justificativa simples de por que pode estar relacionada. O usuário escolherá uma opção e a informação deverá ser confirmada por profissional habilitado antes de qualquer documento clínico.",
        input: `Relato de sintomas do paciente:\n${symptoms}`,
        text: {
          format: {
            type: "json_schema",
            name: "cid_suggestions",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                suggestions: {
                  type: "array",
                  minItems: 1,
                  maxItems: 4,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      code: { type: "string" },
                      description: { type: "string" },
                      rationale: { type: "string" },
                    },
                    required: ["code", "description", "rationale"],
                  },
                },
              },
              required: ["suggestions"],
            },
          },
        },
        max_output_tokens: 900,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("OpenAI CID error", { status: response.status, model, detail });
      return NextResponse.json(
        {
          success: false,
          code: `OPENAI_${response.status}`,
          message: friendlyOpenAIError(response.status),
        },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as OpenAIResponsePayload;
    const outputText = collectOutputText(payload);

    if (!outputText) {
      console.error("OpenAI CID returned no output_text", payload);
      return NextResponse.json(
        { success: false, message: "A IA respondeu sem sugestões. Tente descrever os sintomas com mais detalhes." },
        { status: 502 },
      );
    }

    let parsed: { suggestions?: unknown };
    try {
      parsed = JSON.parse(outputText) as { suggestions?: unknown };
    } catch (parseError) {
      console.error("OpenAI CID JSON parse error", parseError, outputText);
      return NextResponse.json(
        { success: false, message: "A IA respondeu em um formato inesperado. Tente novamente." },
        { status: 502 },
      );
    }

    const suggestions = normalizeSuggestions(parsed.suggestions);
    if (!suggestions.length) {
      return NextResponse.json(
        { success: false, message: "Não encontrei uma sugestão segura com esse relato. Descreva melhor os sintomas ou informe o CID somente se souber." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      success: true,
      source: "openai",
      model,
      suggestions,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { success: false, message: "A análise demorou mais que o esperado. Tente novamente." },
        { status: 504 },
      );
    }

    console.error("Erro no assistente de CID:", error);
    return NextResponse.json(
      { success: false, message: "Não foi possível conectar ao assistente de CID agora." },
      { status: 500 },
    );
  } finally {
    clearTimeout(timer);
  }
}
