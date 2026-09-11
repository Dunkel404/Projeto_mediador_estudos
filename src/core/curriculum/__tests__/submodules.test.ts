import { describe, it, expect } from 'vitest';
import { CURRICULUM_NODES } from '../nodes';
import { getSubModulesForNode } from '../submodules';
import { DynamicSubModulePayloadSchema } from '../../../types/ai-contract';

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
});
