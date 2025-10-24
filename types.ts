export interface FailureAnalysis {
  rootCause: 'FALHA_RECUPERACAO' | 'FALHA_RACIOCINIO' | 'FALHA_FORMATACAO' | 'ALUCINACAO' | 'OUTRO';
  justification: string;
  suggestion: string;
}

export interface EvaluationMetric {
  score: number;
  justification: string;
}

export interface TestCase {
  id: number;
  question: string;
  expectedAnswer: string;
  referenceContexts: string;
  generatedAnswer?: string; // Resposta simulada pelo modelo (Prompt A)
  generatedAnswerB?: string; // Resposta simulada pelo modelo (Prompt B)
  isManual?: boolean; // Identifica se o teste foi adicionado manualmente
  resultStatus?: 'PASSOU' | 'FALHOU';
  resultDetails?: string;
  responseTime?: number;
  failureAnalysis?: FailureAnalysis;
  evaluation?: EvaluationResults; // Individual evaluation for this test case
  regressionStatus?: 'improvement' | 'regression' | 'unchanged';
}

export interface EvaluationResults {
  faithfulness: EvaluationMetric;
  answerRelevancy: EvaluationMetric;
  contextRecall: EvaluationMetric;
  contextPrecision: EvaluationMetric;
}

export type EvaluationStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface StructuredResponsePart {
  text: string;
  sourceChunkIndex: number; // The index of the chunk in the retrievedChunks array of its step
  sourceActionIndex?: number; // The index of the ActionStep in the trace steps array
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  structuredText?: StructuredResponsePart[];
}

export interface RetrievedChunk {
  source: string;
  similarityScore: number;
  content: string;
}

export interface PromptVersion {
  id: string;
  name: string;
  content: string;
}

export interface ApprovalSnapshot {
  timestamp: string;
  systemPrompt: string;
  chunkingStrategy: string;
  embeddingModel: string;
  evaluationResults: EvaluationResults;
}

export type KnowledgeBaseStatus = "PRODUÇÃO" | "TESTE A/B" | "ARQUIVADA";

export interface KnowledgeBaseVersion {
  id: string;
  name: string;
  status: KnowledgeBaseStatus;
  procedureCount: number;
  createdAt: string;
  author: string;
  file?: File;
  validationResults?: ValidationResult[];
  categoryCount: number;
  accuracy: number;
  avgResponseTime: number;
}

export interface ValidationResult {
    status: 'success' | 'warning' | 'error';
    title: string;
    description: string;
}

export interface AnalysisItem {
    status: 'success' | 'warning' | 'error' | 'info';
    title: string;
    description: string;
}

export interface AnalysisReport {
    generalScore: number;
    qualityScore: number;
    contextAnalysis: AnalysisItem[];
    guardrailsAnalysis: AnalysisItem[];
    bestPractices: string[];
    clarity: number;
    completeness: number;
    specificity: number;
}

export type SandboxStatus = "Pronto" | "Testando";

export interface TestSuite {
  id: string;
  name: string;
  version: string;
  createdAt: string;
  testCases: TestCase[];
}

// For Agent Execution Trace
export interface ThoughtStep {
  type: 'thought';
  text: string;
}

export interface ActionStep {
  type: 'action';
  tool: 'search';
  query: string;
  results: RetrievedChunk[];
}

export interface SynthesisStep {
  type: 'synthesis';
  text: string;
}

export type ExecutionStep = ThoughtStep | ActionStep | SynthesisStep;

export interface AgentExecutionTrace {
  steps: ExecutionStep[];
}


export interface Sandbox {
  id: string;
  name: string;
  status: SandboxStatus;
  updatedAt: string;
  isBaseline?: boolean;
  
  // Phase 1
  chunkingStrategy: string;
  embeddingModel: string;
  selectedKbVersionId: string | null;

  // Phase 2
  systemPrompt: string;
  systemPromptB: string;
  isComparing: boolean;
  selectedPromptVersionId: string | null;
  selectedPromptVersionIdB: string | null;
  
  // Phase 3
  attachedTestSuiteId: string | null;
  testRun: TestCase[];
  evaluationResults: EvaluationResults | null;
  evaluationStatus: EvaluationStatus;
  evaluationResultsB: EvaluationResults | null;
  evaluationStatusB: EvaluationStatus;
  regressionAnalysis?: { improvements: number; regressions: number; unchanged: number } | null;


  // Phase 4
  approvalSnapshot: ApprovalSnapshot | null;
}

export interface SessionData {
  sandboxes: Sandbox[];
  activeSandboxId: string;
  knowledgeBaseVersions: KnowledgeBaseVersion[];
  promptVersions: PromptVersion[];
  testSuites: TestSuite[];
}

export interface PromptSuggestion {
  strategy: string;
  justification: string;
  prompt: string;
}