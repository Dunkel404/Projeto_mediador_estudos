import {
  ZeroContextPromptPayload,
  LessonAndAssessmentSchema,
  LessonAndAssessmentResponse,
} from '@/types/ai-contract';
import { getOfflineAssessment } from './offline-bank';

export class GeminiTelemetryEngine {
  private oauthToken: string | null = null;
  private tokenExpiresAt: number | null = null;

  constructor() {}

  public setOAuthToken(token: string | null, expiresAt: number | null = null) {
    this.oauthToken = token;
    this.tokenExpiresAt = expiresAt;
  }

  public isTokenValid(): boolean {
    if (!this.oauthToken) return false;
    if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt) return false;
    return true;
  }

  /**
   * Constrói o Prompt de Contexto Zero estrito para a LLM
   */
  public buildZeroContextPrompt(payload: ZeroContextPromptPayload): string {
    return `Você é o ARQUITETO E EDUCADOR DE COMPUTAÇÃO GRÁFICA SÊNIOR (didática direta, analítica e de impacto de Pedro Assaad).
Gere uma lição e prova de estresse matemática BRUTAL focada em Shaders & 3D, estritamente em formato JSON.

[TELEMETRIA DO ALUNO - CONTEXTO ZERO]
${JSON.stringify(payload, null, 2)}

[DIRETRIZES DE RIGOR MATEMÁTICO]
- Trilha: Do Pré-Cálculo a Tensores e Iluminação Global (Kajiya, Beer-Lambert, BRDF Cook-Torrance, SDFs, Quatérnions).
- Não aceite respostas superficiais. Cada exercício deve exigir manipulação algébrica formal ou cálculo numérico exato.
- Toda matemática converge OBRIGATORIAMENTE para computação gráfica em tempo real e fragment shaders.
- Inclua diagnósticos de armadilhas cirúrgicos para erros comuns de escala, omissão de normalização ou confusão de eixos.

[CONTRATO JSON OBRIGATÓRIO]
Sua resposta deve ser EXCLUSIVAMENTE um objeto JSON válido correspondente ao seguinte esquema:
{
  "session_id": "string",
  "topic": {
    "title": "string",
    "math_foundation": "string",
    "graphic_application": "string"
  },
  "interactive_exercise": {
    "type": "NUMERICAL_AND_SHADER_MECHANIC" | "ALGEBRAIC_MANIPULATION" | "TENSOR_AND_MATRIX_PROOF",
    "statement_latex": "string",
    "expected_variables": { "var_name": "expected_value_as_string" },
    "diagnostic_traps": [
      { "trap_id": "string", "condition": "var_name == value", "feedback": "string" }
    ]
  },
  "shader_sandbox_payload": {
    "shader_type": "fragment_glsl",
    "boilerplate_glsl": "string",
    "test_vectors": [{ "input_p": [0,0,0], "expected_normal": [0,0,1] }]
  },
  "rubric_criteria": {
    "minimum_score_to_advance": 85,
    "time_threshold_seconds": 90
  }
}`;
  }

  /**
   * Gera a avaliação via Gemini com autenticação OAuth 2.0 (Bearer Token)
   */
  public async generateAssessment(
    payload: ZeroContextPromptPayload
  ): Promise<{ data: LessonAndAssessmentResponse; isOfflineFallback: boolean; error?: string }> {
    const nodeId = payload.user_profile.node_id;

    if (!this.isTokenValid() || typeof window === 'undefined' || !navigator.onLine) {
      return {
        data: getOfflineAssessment(nodeId),
        isOfflineFallback: true,
      };
    }

    try {
      const prompt = this.buildZeroContextPrompt(payload);

      const endpoint =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.oauthToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(
          `Falha na requisição Gemini OAuth (${response.status}): ${
            errJson?.error?.message || response.statusText
          }`
        );
      }

      const resData = await response.json();
      const rawText = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsedJson = JSON.parse(rawText);
      const validated = LessonAndAssessmentSchema.parse(parsedJson);

      return {
        data: validated,
        isOfflineFallback: false,
      };
    } catch (err: any) {
      console.warn('Gemini OAuth request failed, falling back to deterministic offline bank:', err);
      return {
        data: getOfflineAssessment(nodeId),
        isOfflineFallback: true,
        error: err.message || 'Falha na autenticação ou conexão Gemini OAuth',
      };
    }
  }
}

export const geminiEngine = new GeminiTelemetryEngine();
