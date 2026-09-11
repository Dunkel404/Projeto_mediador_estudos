import { DidacticArticle, InteractiveExercise } from './ai-contract';

export type Tier = 0 | 1 | 2 | 3 | 4;

export type NodeCategory =
  | 'algebra_trigonometry'
  | 'linear_algebra'
  | 'differential_calculus'
  | 'integral_calculus'
  | 'vector_fields_tensors';

export type NodeStatus = 'locked' | 'available' | 'mastered' | 'critical_decay';

export type ProficiencyLevel = 'Inicial' | 'Moderado' | 'Alto' | 'Altíssimo';

export type ResponseSpeed = 'Lenta' | 'Moderada' | 'Alta' | 'Altíssima';

export type SubModuleDepth =
  | 'base_formal_baixo_3d'
  | 'transicao_espacial_medio_3d'
  | 'shaders_avancados_alto_3d'
  | 'extensao_dinamica_gemini';

export interface SubModule {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  depthType: SubModuleDepth;
  threeDApplicabilityWeight: number; // 0.15 a 1.0 (percentual de 3D)
  mathFoundation: string;
  graphicApplication: string;
  latexFormulas: string[];
  didacticArticle?: DidacticArticle;
  interactiveExercise?: InteractiveExercise;
  defaultGlslShader?: string;
  targetScoreKnowledge: number;
  targetScore3D: number;
  isDynamicGenerated?: boolean;
}

export interface CurriculumNode {
  id: string;
  tier: Tier;
  title: string;
  category: NodeCategory;
  mathFoundation: string;
  graphicApplication: string;
  prerequisites: string[];
  latexFormulas: string[];
  defaultGlslShader: string;
  targetScoreKnowledge: number; // Ex: 90
  targetScore3D: number; // Ex: 10
  gridPosition: { x: number; y: number }; // For 2D desktop spatial graph
  submodules?: SubModule[];
}

export interface SubModuleProgress {
  subModuleId: string;
  isCompleted: boolean;
  scoreKnowledge: number;
  score3D: number;
  attempts: number;
}

export interface UserNodeProgress {
  nodeId: string;
  status: NodeStatus;
  scoreKnowledge: number; // 0 to 90
  score3D: number; // 0 to 10
  proficiencyLevel: ProficiencyLevel;
  responseSpeed: ResponseSpeed;
  attentionPoints: string[];
  totalAttempts: number;
  correctAttempts: number;
  lastAttemptAt?: string;
  submoduleProgressMap?: Record<string, SubModuleProgress>;
  activeSubModuleId?: string;
}
