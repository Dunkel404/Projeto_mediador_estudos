import { GoogleGenAI } from '@google/genai';
import {
  ZeroContextPromptPayload,
  LessonAndAssessmentSchema,
  LessonAndAssessmentResponse,
} from '@/types/ai-contract';
import { getOfflineAssessment } from './offline-bank';

export class GeminiTelemetryEngine {
  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
  }

  public setApiKey(key: string) {
    this.apiKey = key;
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
   * Gera a avaliação via Gemini com fallback offline automático
   */
  public async generateAssessment(
    payload: ZeroContextPromptPayload
  ): Promise<{ data: LessonAndAssessmentResponse; isOfflineFallback: boolean; error?: string }> {
    const nodeId = payload.user_profile.node_id;

    if (!this.apiKey || typeof window === 'undefined' || !navigator.onLine) {
      return {
        data: getOfflineAssessment(nodeId),
        isOfflineFallback: true,
      };
    }

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });
      const prompt = this.buildZeroContextPrompt(payload);

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '';
      const parsedJson = JSON.parse(text);
      const validated = LessonAndAssessmentSchema.parse(parsedJson);

      return {
        data: validated,
        isOfflineFallback: false,
      };
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to deterministic offline bank:', err);
      return {
        data: getOfflineAssessment(nodeId),
        isOfflineFallback: true,
        error: err.message || 'Falha na resposta da API Gemini',
      };
    }
  }
}

export const geminiEngine = new GeminiTelemetryEngine();
