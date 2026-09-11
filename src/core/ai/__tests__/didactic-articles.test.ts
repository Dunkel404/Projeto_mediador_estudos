import { describe, it, expect } from 'vitest';
import { OFFLINE_STRESS_BANK, getOfflineAssessment } from '../offline-bank';
import { LessonAndAssessmentSchema } from '../../../types/ai-contract';

describe('Didactic Articles & Scientific Curated References', () => {
  it('should have a rich, valid didactic article for t0_algebra_fma', () => {
    const lesson = getOfflineAssessment('t0_algebra_fma');
    const parsed = LessonAndAssessmentSchema.parse(lesson);

    expect(parsed.didactic_article).toBeDefined();
    const article = parsed.didactic_article!;
    expect(article.title).toContain('Instrução FMA');
    expect(article.scientific_pedagogy_note).toBeDefined();
    expect(article.scientific_pedagogy_note.length).toBeGreaterThan(30);
    expect(article.geometric_intuition.length).toBeGreaterThan(30);
    expect(article.historical_context.length).toBeGreaterThan(30);
    expect(article.mathematical_derivation_latex.length).toBeGreaterThan(0);
    expect(article.graphics_engine_pipeline.length).toBeGreaterThan(30);

    // Curated references
    expect(article.curated_references.papers_and_books.length).toBeGreaterThan(0);
    expect(article.curated_references.videos_and_talks.length).toBeGreaterThan(0);
    expect(article.curated_references.code_and_projects.length).toBeGreaterThan(0);
  });

  it('should have valid didactic articles for all nodes in OFFLINE_STRESS_BANK', () => {
    const keys = Object.keys(OFFLINE_STRESS_BANK);
    expect(keys.length).toBeGreaterThan(0);

    for (const key of keys) {
      const lesson = OFFLINE_STRESS_BANK[key];
      expect(() => LessonAndAssessmentSchema.parse(lesson)).not.toThrow();
      expect(lesson.didactic_article).toBeDefined();
      expect(lesson.didactic_article?.curated_references.papers_and_books.length).toBeGreaterThan(0);
      expect(lesson.didactic_article?.curated_references.videos_and_talks.length).toBeGreaterThan(0);
      expect(lesson.didactic_article?.curated_references.code_and_projects.length).toBeGreaterThan(0);
    }
  });

  it('should provide rich didactic articles across various curriculum tiers via getOfflineAssessment', () => {
    const testNodes = [
      't0_algebra_fma',
      't1_vectors_dot',
      't2_tetrahedron_normals',
      't3_fresnel_schlick',
      't4_metric_tensor',
    ];

    for (const nodeId of testNodes) {
      const assessment = getOfflineAssessment(nodeId);
      const parsed = LessonAndAssessmentSchema.parse(assessment);
      expect(parsed.didactic_article).toBeDefined();
      expect(parsed.didactic_article!.read_time_minutes).toBeGreaterThan(0);
      expect(parsed.didactic_article!.curated_references.papers_and_books.length).toBeGreaterThan(0);
      expect(parsed.didactic_article!.curated_references.videos_and_talks.length).toBeGreaterThan(0);
      expect(parsed.didactic_article!.curated_references.code_and_projects.length).toBeGreaterThan(0);
    }
  });

  it('should fallback gracefully to a complete article for any unknown node', () => {
    const fallback = getOfflineAssessment('unknown_future_node');
    const parsed = LessonAndAssessmentSchema.parse(fallback);
    expect(parsed.didactic_article).toBeDefined();
    expect(parsed.didactic_article?.curated_references.papers_and_books.length).toBeGreaterThan(0);
  });
});
