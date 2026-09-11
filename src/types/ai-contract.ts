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

export const LessonAndAssessmentSchema = z.object({
  session_id: z.string(),
  topic: z.object({
    title: z.string(),
    math_foundation: z.string(),
    graphic_application: z.string(),
  }),
  interactive_exercise: InteractiveExerciseSchema,
  shader_sandbox_payload: ShaderSandboxPayloadSchema.optional(),
  rubric_criteria: z.object({
    minimum_score_to_advance: z.number(),
    time_threshold_seconds: z.number(),
  }),
});

export type LessonAndAssessmentResponse = z.infer<typeof LessonAndAssessmentSchema>;
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
