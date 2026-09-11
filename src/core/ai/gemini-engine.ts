import {
  ZeroContextPromptPayload,
  LessonAndAssessmentSchema,
  LessonAndAssessmentResponse,
} from '../../types/ai-contract';
import { getOfflineAssessment } from './offline-bank';

export class GeminiTelemetryEngine {
  /**
   * Constrói o Prompt de Contexto Zero cirúrgico otimizado para a interface web do Gemini
   * com instrução inegociável de retorno exclusivo de JSON puro.
   */
  public buildZeroContextPrompt(payload: ZeroContextPromptPayload): string {
    return `[INSTRUÇÃO CRÍTICA DE FORMATO - LEIA COM ATENÇÃO]
Você deve atuar como o ARQUITETO E EDUCADOR DE COMPUTAÇÃO GRÁFICA SÊNIOR (didática incisiva, analítica e de impacto de Pedro Assaad).
Você deve responder ÚNICA E EXCLUSIVAMENTE com o objeto JSON estruturado abaixo.
NÃO inclua nenhuma introdução, nenhuma explicação em texto livre, nenhuma saudação e nenhum encerramento.
Sua resposta deve começar imediatamente com '{' e terminar com '}'.

[TELEMETRIA DETERMINÍSTICA DO ALUNO - CONTEXTO ZERO]
${JSON.stringify(payload, null, 2)}

[DIRETRIZES DE RIGOR MATEMÁTICO BRUTAL]
- Trilha: Do Pré-Cálculo a Tensores e Iluminação Física (Kajiya, Beer-Lambert, BRDF Cook-Torrance, SDFs, Quatérnions).
- Não aceite respostas superficiais. Cada exercício deve exigir manipulação algébrica formal ou cálculo numérico exato.
- Toda matemática converge OBRIGATORIAMENTE para computação gráfica em tempo real e fragment shaders.
- Crie armadilhas diagnósticas reais ('diagnostic_traps') para interceptar erros comuns (ex: esquecimento de normalização euclidiana, confusão de coordenadas UV com tela, ou inversão de sinal).

[SCHEMA JSON OBRIGATÓRIO]
{
  "session_id": "sess_gemini_${Date.now()}",
  "topic": {
    "title": "Título analítico do tópico",
    "math_foundation": "Explicação matemática precisa e formal",
    "graphic_application": "Aplicação real em shaders GLSL/3D"
  },
  "interactive_exercise": {
    "type": "NUMERICAL_AND_SHADER_MECHANIC",
    "statement_latex": "\\\\text{Enunciado do problema em LaTeX}",
    "expected_variables": {
      "variavel_1": "valor_esperado"
    },
    "diagnostic_traps": [
      {
        "trap_id": "nome_do_erro_comum",
        "condition": "variavel_1 == valor_do_erro",
        "feedback": "Diagnóstico cirúrgico do erro aritmético ou conceitual cometido"
      }
    ]
  },
  "shader_sandbox_payload": {
    "shader_type": "fragment_glsl",
    "boilerplate_glsl": "#version 300 es\\nprecision highp float;\\n...",
    "test_vectors": [{ "input_p": [0,0,0], "expected_normal": [0,0,1] }]
  },
  "rubric_criteria": {
    "minimum_score_to_advance": 85,
    "time_threshold_seconds": 90
  }
}`;
  }

  /**
   * Extrai, sanitiza e valida o JSON copiado do Gemini Web
   */
  public parseAndValidateGeminiResponse(rawText: string): {
    success: boolean;
    data?: LessonAndAssessmentResponse;
    error?: string;
  } {
    if (!rawText || !rawText.trim()) {
      return { success: false, error: 'O texto fornecido está vazio.' };
    }

    try {
      let cleaned = rawText.trim();

      // Remove blocos de código markdown se o Gemini tiver incluído ```json ... ```
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      }

      // Se ainda contiver texto ao redor, extrai o conteúdo entre a primeira '{' e a última '}'
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');

      if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
        return {
          success: false,
          error: 'Nenhum objeto JSON delimitado por { e } foi encontrado na resposta colada.',
        };
      }

      const jsonSubstring = cleaned.substring(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(jsonSubstring);
      const validated = LessonAndAssessmentSchema.parse(parsed);

      return {
        success: true,
        data: validated,
      };
    } catch (err: any) {
      return {
        success: false,
        error: `Erro de validação do contrato JSON: ${err.message || 'Estrutura JSON inválida'}`,
      };
    }
  }

  /**
   * Obtém a avaliação offline de contingência
   */
  public getOfflineFallback(nodeId: string): LessonAndAssessmentResponse {
    return getOfflineAssessment(nodeId);
  }
}

export const geminiEngine = new GeminiTelemetryEngine();
