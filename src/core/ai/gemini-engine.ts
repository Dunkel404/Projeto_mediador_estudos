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

[DIRETRIZES DO PROFESSOR DIGITAL & RIGOR MATEMÁTICO BRUTAL]
- Atue como um Professor Digital de Computação Gráfica com a didática cirúrgica de Pedro Assaad e fundamentação pedagógica científica (Cognitive Load Theory, Dual Coding Theory).
- Forneça um ARTIGO DIDÁTICO COESO E COMPLETO em 'didactic_article', com:
  * Intuição geométrica lúcida (modelo mental físico).
  * Contexto histórico da matemática e da computação gráfica.
  * Deduções analíticas formais passo a passo em LaTeX KaTeX.
  * Conexão explícita com o pipeline da GPU (fragment shader, rasterização, ray marching).
  * Curadoria criteriosa de referências (papers seminais, livros canônicos, vídeos/palestras recomendadas e shaders no Shadertoy/Github).
- Crie um exercício interativo ('interactive_exercise') com armadilhas diagnósticas reais ('diagnostic_traps') para interceptar vícios aritméticos ou conceituais.
- Toda a matemática converge OBRIGATORIAMENTE para tempo real, shaders GLSL/HLSL e renderização moderna.

[SCHEMA JSON OBRIGATÓRIO]
{
  "session_id": "sess_gemini_${Date.now()}",
  "topic": {
    "title": "Título analítico do tópico",
    "math_foundation": "Explicação matemática precisa e formal",
    "graphic_application": "Aplicação real em shaders GLSL/3D"
  },
  "didactic_article": {
    "title": "Título do Artigo Didático",
    "subtitle": "Subtítulo explicando a essência em computação gráfica",
    "read_time_minutes": 6,
    "scientific_pedagogy_note": "Explicação fundamentada em ciência do aprendizado sobre como absorver este conceito",
    "historical_context": "Origem histórica e motivação matemática e na indústria gráfica",
    "geometric_intuition": "Intuição geométrica espacial clara para construir o modelo mental",
    "mathematical_derivation_latex": [
      "\\\\text{Passo 1: Dedução}",
      "\\\\vec{a} \\\\cdot \\\\vec{b} = \\\\sum_{i=1}^n a_i b_i"
    ],
    "graphics_engine_pipeline": "Como isso opera nos estágios da GPU e fragment shader",
    "curated_references": {
      "papers_and_books": [
        {
          "title": "Real-Time Rendering 4th Edition",
          "author": "Tomas Akenine-Möller et al.",
          "year": "2018",
          "description": "Capítulo essencial sobre a mecânica de shading.",
          "url": "https://www.realtimerendering.com/"
        }
      ],
      "videos_and_talks": [
        {
          "title": "Nome da aula ou palestra",
          "channel_or_speaker": "Canal ou Palestrante",
          "key_takeaway": "Insight chave a ser extraído do vídeo",
          "search_query_or_url": "Termo de busca recomendado no YouTube"
        }
      ],
      "code_and_projects": [
        {
          "name": "Nome do projeto ou Shader",
          "repository_or_shadertoy": "URL ou ID do Shadertoy",
          "what_to_analyze": "O que inspecionar especificamente no código fonte"
        }
      ]
    }
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
    "boilerplate_glsl": "#version 300 es\\nprecision highp float;\\nout vec4 fragColor;\\nvoid main() { fragColor = vec4(1.0); }",
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
