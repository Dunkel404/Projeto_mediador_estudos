import { z } from 'zod';

export const DiagnosticTrapSchema = z.object({
  trap_id: z.string(),
  condition: z.string(),
  feedback: z.string(),
});

export const TestVectorSchema = z.object({
  input_p: z.array(z.number()),
  expected_normal: z.array(z.number()),
});

export const ShaderSandboxPayloadSchema = z.object({
  shader_type: z.literal('fragment_glsl'),
  boilerplate_glsl: z.string(),
  test_vectors: z.array(TestVectorSchema).optional(),
});

export const InteractiveExerciseSchema = z.object({
  type: z.enum(['NUMERICAL_AND_SHADER_MECHANIC', 'ALGEBRAIC_MANIPULATION', 'TENSOR_AND_MATRIX_PROOF']),
  statement_latex: z.string(),
  expected_variables: z.record(z.string(), z.string()),
  diagnostic_traps: z.array(DiagnosticTrapSchema),
});

export const BookOrPaperReferenceSchema = z.object({
  title: z.string(),
  author: z.string(),
  year: z.string(),
  description: z.string(),
  url: z.string().optional(),
});

export const VideoReferenceSchema = z.object({
  title: z.string(),
  channel_or_speaker: z.string(),
  key_takeaway: z.string(),
  search_query_or_url: z.string(),
});

export const ProjectReferenceSchema = z.object({
  name: z.string(),
  repository_or_shadertoy: z.string(),
  what_to_analyze: z.string(),
});

export const CuratedReferencesSchema = z.object({
  papers_and_books: z.array(BookOrPaperReferenceSchema).default([]),
  videos_and_talks: z.array(VideoReferenceSchema).default([]),
  code_and_projects: z.array(ProjectReferenceSchema).default([]),
});

export const DidacticArticleSchema = z.object({
  title: z.string(),
  subtitle: z.string(),
  read_time_minutes: z.number().default(6),
  scientific_pedagogy_note: z.string(),
  historical_context: z.string(),
  geometric_intuition: z.string(),
  mathematical_derivation_latex: z.array(z.string()).default([]),
  graphics_engine_pipeline: z.string(),
  curated_references: CuratedReferencesSchema,
});

export const DynamicSubModulePayloadSchema = z.object({
  submodule_id: z.string(),
  order: z.number(),
  title: z.string(),
  depth_type: z.enum([
    'base_formal_baixo_3d',
    'transicao_espacial_medio_3d',
    'shaders_avancados_alto_3d',
    'extensao_dinamica_gemini',
  ]),
  three_d_applicability_weight: z.number().min(0).max(1),
  pedagogical_justification: z.string(),
  didactic_article: DidacticArticleSchema,
  interactive_exercise: InteractiveExerciseSchema,
  shader_sandbox_payload: ShaderSandboxPayloadSchema.optional(),
  rubric_criteria: z.object({
    minimum_score_to_advance: z.number(),
    time_threshold_seconds: z.number(),
  }),
});

export const LessonAndAssessmentSchema = z.object({
  session_id: z.string(),
  topic: z.object({
    title: z.string(),
    math_foundation: z.string(),
    graphic_application: z.string(),
  }),
  current_submodule_index: z.number().optional(),
  didactic_article: DidacticArticleSchema.optional(),
  interactive_exercise: InteractiveExerciseSchema,
  shader_sandbox_payload: ShaderSandboxPayloadSchema.optional(),
  rubric_criteria: z.object({
    minimum_score_to_advance: z.number(),
    time_threshold_seconds: z.number(),
  }),
  new_submodule_to_append: DynamicSubModulePayloadSchema.optional(),
});

export type DynamicSubModulePayload = z.infer<typeof DynamicSubModulePayloadSchema>;
export type LessonAndAssessmentResponse = z.infer<typeof LessonAndAssessmentSchema>;
export type DidacticArticle = z.infer<typeof DidacticArticleSchema>;
export type CuratedReferences = z.infer<typeof CuratedReferencesSchema>;
export type InteractiveExercise = z.infer<typeof InteractiveExerciseSchema>;
export type DiagnosticTrap = z.infer<typeof DiagnosticTrapSchema>;

export interface ZeroContextPromptPayload {
  user_profile: {
    node_id: string;
    node_title: string;
    telemetry: {
      nota_conhecimento: number;
      nota_3d: number;
      nivel_proficiencia: 'Inicial' | 'Moderado' | 'Alto' | 'Altíssimo';
      rapidez_resposta: 'Lenta' | 'Moderada' | 'Alta' | 'Altíssima';
      pontos_atencao: string[];
    };
    fsrs_state: {
      stability: number;
      difficulty: number;
      repetitions: number;
      lapses: number;
    };
    trigger_mode: 'NORMAL' | 'DEEP_DIVE_50' | 'STRESS_TEST_85' | 'SHADER_CHALLENGE_90';
  };
}
