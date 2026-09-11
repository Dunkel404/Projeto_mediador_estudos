import { describe, it, expect } from 'vitest';
import { CURRICULUM_NODES } from '../nodes';
import { getSubModulesForNode, INITIAL_SUBMODULES } from '../submodules';
import { DynamicSubModulePayloadSchema } from '../../../types/ai-contract';
import { evaluateSubmission } from '../../ai/evaluator';

describe('Curriculum Submodules & Gradual 3D Progression', () => {
  it('every curriculum node must contain sequential submodules', () => {
    expect(CURRICULUM_NODES.length).toBeGreaterThanOrEqual(18);

    for (const node of CURRICULUM_NODES) {
      expect(node.submodules).toBeDefined();
      expect(node.submodules!.length).toBeGreaterThanOrEqual(3);

      // Verify orders are 1, 2, 3...
      node.submodules!.forEach((sub, idx) => {
        expect(sub.order).toBe(idx + 1);
        expect(sub.moduleId).toBe(node.id);
        expect(sub.title.length).toBeGreaterThan(5);
        expect(sub.threeDApplicabilityWeight).toBeGreaterThan(0);
        expect(sub.threeDApplicabilityWeight).toBeLessThanOrEqual(1.0);
      });
    }
  });

  it('submodules must enforce gradual 3D applicability: Base Formal (low) -> Spatial (medium) -> Shaders (high)', () => {
    for (const node of CURRICULUM_NODES) {
      const subs = node.submodules!;
      const sub1 = subs[0]; // Base Formal
      const sub2 = subs[1]; // Transição Espacial
      const sub3 = subs[2]; // Shaders & GPU

      expect(sub1.depthType).toBe('base_formal_baixo_3d');
      expect(sub1.threeDApplicabilityWeight).toBeLessThanOrEqual(0.35); // Low 3D

      expect(sub2.depthType).toBe('transicao_espacial_medio_3d');
      expect(sub2.threeDApplicabilityWeight).toBeGreaterThan(sub1.threeDApplicabilityWeight); // Medium 3D

      expect(sub3.depthType).toBe('shaders_avancados_alto_3d');
      expect(sub3.threeDApplicabilityWeight).toBeGreaterThan(sub2.threeDApplicabilityWeight); // High 3D
      expect(sub3.threeDApplicabilityWeight).toBe(1.0);
    }
  });

  it('validates DynamicSubModulePayloadSchema for AI-generated submodules', () => {
    const mockGeminiSubmodule = {
      submodule_id: 't0_algebra_fma_sub_4_dynamic',
      order: 4,
      title: 'Aprofundamento em Instabilidade de Divisão por Zero e IEEE-754 Subnormais',
      depth_type: 'extensao_dinamica_gemini',
      three_d_applicability_weight: 0.85,
      pedagogical_justification: 'Aluno apresentou dúvida sobre números desnormalizados em fragment shaders.',
      didactic_article: {
        title: 'Subnormais na Arquitetura de Shaders',
        subtitle: 'Como o bit de flush-to-zero (FTZ) afeta a performance das ALUs',
        read_time_minutes: 8,
        scientific_pedagogy_note: 'Ancoragem física na microarquitetura.',
        historical_context: 'Instruções denormais custavam centenas de ciclos até a introdução do modo DAZ/FTZ.',
        geometric_intuition: 'Perto de zero absoluto, os números perdem o bit implícito da mantissa.',
        mathematical_derivation_latex: [
          'x = 0.m \\times 2^{-126} \\quad \\text{(Número Subnormal)}',
          '\\text{FTZ}(x) = 0 \\quad \\text{se } |x| < 2^{-126}'
        ],
        graphics_engine_pipeline: 'ALUs mobile costumam forçar FTZ por economia de energia.',
        curated_references: {
          papers_and_books: [],
          videos_and_talks: [],
          code_and_projects: []
        }
      },
      interactive_exercise: {
        type: 'NUMERICAL_AND_SHADER_MECHANIC',
        statement_latex: '\\text{Qual o valor de FTZ para um subnormal?}',
        expected_variables: {
          val: '0'
        },
        diagnostic_traps: []
      },
      rubric_criteria: {
        minimum_score_to_advance: 85,
        time_threshold_seconds: 90
      }
    };

    expect(() => DynamicSubModulePayloadSchema.parse(mockGeminiSubmodule)).not.toThrow();
  });

  describe('Submodule Interactive Exercises Evaluation & Diagnostic Traps', () => {
    describe('t0_algebra_fma Submodules', () => {
      const subs = INITIAL_SUBMODULES.t0_algebra_fma;

      it('sub1 (IEEE-754 Conjugate Stabilization) evaluates correct conjugate and detects direct subtraction trap', () => {
        const exercise = subs[0].interactiveExercise!;
        expect(exercise).toBeDefined();
        expect(exercise.statement_latex).toContain('conjugado');

        // Correct answer: 1/(sqrt(x+1)+sqrt(x))
        const correctRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { conjugado: '1/(sqrt(x+1)+sqrt(x))' }
        );
        expect(correctRes.isCorrect).toBe(true);
        expect(correctRes.score).toBe(90);
        expect(correctRes.score3D).toBe(10);

        // Diagnostic trap: direct subtraction
        const trapRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { conjugado: 'sqrt(x+1)-sqrt(x)' }
        );
        expect(trapRes.isCorrect).toBe(false);
        expect(trapRes.matchedTrap?.trap_id).toBe('subtracao_direta');
        expect(trapRes.feedbackMessage).toContain('subtração direta');
      });

      it('sub2 (Bézier Spline Horner FMA) evaluates count of FMAs and detects naive cost trap', () => {
        const exercise = subs[1].interactiveExercise!;
        expect(exercise).toBeDefined();

        // Correct answer: 3 FMAs
        const correctRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { fma_count: '3' }
        );
        expect(correctRes.isCorrect).toBe(true);
        expect(correctRes.score).toBe(90);

        // Trap: naive cost of 6
        const trapRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { fma_count: '6' }
        );
        expect(trapRes.isCorrect).toBe(false);
        expect(trapRes.matchedTrap?.trap_id).toBe('custo_ingenuo');
        expect(trapRes.feedbackMessage).toContain('custo com potências explícitas');
      });

      it('sub3 (GPU Quintic Smootherstep FMA) evaluates Perlin Horner form and catches non-factored trap', () => {
        const exercise = subs[2].interactiveExercise!;
        expect(exercise).toBeDefined();

        // Correct answer: t*t*t*(t*(6*t-15)+10)
        const correctRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { perlin_fma: 't*t*t*(t*(6*t-15)+10)' }
        );
        expect(correctRes.isCorrect).toBe(true);
        expect(correctRes.score).toBe(90);

        // Trap: non-factored 6*t*t*t*t*t
        const trapRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { perlin_fma: '6*t*t*t*t*t' }
        );
        expect(trapRes.isCorrect).toBe(false);
        expect(trapRes.matchedTrap?.trap_id).toBe('perlin_nao_fatorado');
        expect(trapRes.feedbackMessage).toContain('Multiplicação de potências repetidas');
      });
    });

    describe('t1_vectors_dot Submodules', () => {
      const subs = INITIAL_SUBMODULES.t1_vectors_dot;

      it('sub1 (Cauchy-Schwarz Cosine) evaluates angle and catches forgotten norm trap', () => {
        const exercise = subs[0].interactiveExercise!;
        expect(exercise).toBeDefined();

        // Correct answer: 0.6
        const correctRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { cos_theta: '0.6' }
        );
        expect(correctRes.isCorrect).toBe(true);
        expect(correctRes.score).toBe(90);

        // Trap: calculated dot product without dividing by norm (cos_theta == 3)
        const trapRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { cos_theta: '3' }
        );
        expect(trapRes.isCorrect).toBe(false);
        expect(trapRes.matchedTrap?.trap_id).toBe('esquecimento_da_norma');
        expect(trapRes.feedbackMessage).toContain('dividir pela norma');
      });

      it('sub2 (Gram-Schmidt Reflection) evaluates R_y and catches sign inversion trap', () => {
        const exercise = subs[1].interactiveExercise!;
        expect(exercise).toBeDefined();

        // Correct answer: 1.0
        const correctRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { R_y: '1.0' }
        );
        expect(correctRes.isCorrect).toBe(true);
        expect(correctRes.score).toBe(90);

        // Trap: R_y == -1.0
        const trapRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { R_y: '-1.0' }
        );
        expect(trapRes.isCorrect).toBe(false);
        expect(trapRes.matchedTrap?.trap_id).toBe('sinal_invertido');
        expect(trapRes.feedbackMessage).toContain('inverter de sinal');
      });

      it('sub3 (Lambert Cosine Law) evaluates I_diffuse and catches axis projection trap', () => {
        const exercise = subs[2].interactiveExercise!;
        expect(exercise).toBeDefined();

        // Correct answer: 0.8
        const correctRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { I_diffuse: '0.8' }
        );
        expect(correctRes.isCorrect).toBe(true);
        expect(correctRes.score).toBe(90);

        // Trap: projection onto Y axis (0.6) instead of Z axis (0.8)
        const trapRes = evaluateSubmission(
          exercise.expected_variables,
          exercise.diagnostic_traps,
          { I_diffuse: '0.6' }
        );
        expect(trapRes.isCorrect).toBe(false);
        expect(trapRes.matchedTrap?.trap_id).toBe('projecao_y');
        expect(trapRes.feedbackMessage).toContain('aponta no eixo Z');
      });
    });
  });
});
