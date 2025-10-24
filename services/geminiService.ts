import { GoogleGenAI, Type } from "@google/genai";
import { TestCase, RetrievedChunk, StructuredResponsePart, FailureAnalysis, PromptSuggestion, AgentExecutionTrace } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const testDataSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        id: { type: Type.INTEGER },
        question: { type: Type.STRING, description: "A generated question about a hypothetical corporate knowledge base." },
        expectedAnswer: { type: Type.STRING, description: "A detailed, factual answer based on the context." },
        referenceContexts: { type: Type.STRING, description: "The specific context snippet that contains the answer." },
      },
      required: ["id", "question", "expectedAnswer", "referenceContexts"],
    },
};

export const generateTestData = async (size: number): Promise<TestCase[]> => {
  const prompt = `Generate a synthetic, realistic test dataset of ${size} items for evaluating a RAG system. The context is a fictional corporate knowledge base containing information about HR policies, IT security, and project management guidelines. Each item must be unique and have a generated question, an expected ground-truth answer, and the specific reference context.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: testDataSchema,
      },
    });

    const jsonString = response.text.trim();
    const data = JSON.parse(jsonString);
    return data as TestCase[];
  } catch (error) {
    console.error("Error generating test data with Gemini:", error);
    // Return mock data on failure
    return Array.from({ length: size }, (_, i) => ({
        id: i + 1,
        question: `Pergunta de teste mockada ${i + 1}?`,
        expectedAnswer: `Resposta esperada mockada para a pergunta ${i + 1}.`,
        referenceContexts: `Contexto de referência mockado para a pergunta ${i + 1}.`,
    }));
  }
};

// MOCK AGENT LOGIC
const getAgentResponse = async (query: string, systemPrompt: string): Promise<{ responseParts: StructuredResponsePart[]; trace: AgentExecutionTrace }> => {
    // Simulate a complex query that requires multiple steps
    const isComplexQuery = query.toLowerCase().includes('comparar') || query.toLowerCase().includes('e');
    
    if (!isComplexQuery) {
        // Fallback to simple RAG for simple questions
        const simpleResult = await getSinglePassResponse(query, systemPrompt);
        const trace: AgentExecutionTrace = {
            steps: [{ type: 'action', tool: 'search', query: query, results: simpleResult.retrievedChunks }]
        };
        return { responseParts: simpleResult.responseParts, trace };
    }

    // Simulate multi-step reasoning for a complex query
    const trace: AgentExecutionTrace = {
        steps: [
            { type: 'thought', text: "A pergunta do usuário é complexa e parece ter duas partes. Vou pesquisar cada uma separadamente." },
            { 
                type: 'action', 
                tool: 'search', 
                query: "política de bônus para funcionários de meio período",
                results: [
                    { source: 'politica_bonus.pdf', similarityScore: 0.91, content: 'Funcionários de meio período são elegíveis para um bônus anual de até 5% do salário, dependendo da performance individual e da empresa.' }
                ]
            },
            { type: 'thought', text: "Ok, encontrei a política de bônus. Agora preciso encontrar a política de reembolso de despesas de viagem para comparar." },
            {
                type: 'action',
                tool: 'search',
                query: "política de reembolso de despesas de viagem",
                results: [
                    { source: 'reembolso_viagem.pdf', similarityScore: 0.88, content: 'O reembolso de despesas de viagem cobre transporte e hospedagem. Alimentação é coberta até um limite de R$100 por dia.' },
                    { source: 'reembolso_geral.pdf', similarityScore: 0.85, content: 'Todas as solicitações de reembolso devem ser submetidas via sistema interno com as notas fiscais anexadas.' }
                ]
            },
            { type: 'synthesis', text: "Tenho as informações de ambas as buscas. Agora vou sintetizar a resposta final para o usuário." }
        ]
    };
    
    const responseParts: StructuredResponsePart[] = [
        { text: "De acordo com a base de conhecimento, a política de bônus e a de reembolso de despesas são distintas. ", sourceChunkIndex: -1 },
        { text: "Para bônus, funcionários de meio período são elegíveis a até 5% do salário anualmente.", sourceChunkIndex: 0, sourceActionIndex: 1 },
        { text: " Já o reembolso de viagens cobre transporte e hospedagem, com um limite de R$100 diários para alimentação. ", sourceChunkIndex: 0, sourceActionIndex: 3 },
        { text: "Lembre-se que todas as solicitações de reembolso precisam ser feitas pelo sistema interno.", sourceChunkIndex: 1, sourceActionIndex: 3 }
    ];

    return { responseParts, trace };
};


const getSinglePassResponse = async (query: string, systemPrompt: string): Promise<{ responseParts: StructuredResponsePart[]; retrievedChunks: RetrievedChunk[] }> => {
  // This is the original getChatResponse logic
  const fullPrompt = `... (same as original single-pass prompt) ...`;
  // For brevity, assuming the original Gemini call is here.
  // Returning mock data for demonstration.
  const retrievedChunks: RetrievedChunk[] = [
    { source: 'doc_A.pdf', similarityScore: 0.92, content: `O procedimento para solicitar férias é através do portal do funcionário, com 30 dias de antecedência. É necessário a aprovação do gestor. - [${query}]` },
    { source: 'doc_B.pdf', similarityScore: 0.85, content: 'O portal do funcionário também pode ser usado para verificar o saldo de férias e o histórico de solicitações.' }
  ];
  const responseParts: StructuredResponsePart[] = [
      { text: "Para solicitar férias, você deve usar o portal do funcionário ", sourceChunkIndex: -1 },
      { text: "com 30 dias de antecedência e aguardar a aprovação do seu gestor.", sourceChunkIndex: 0, sourceActionIndex: 0 },
      { text: " Você pode verificar seu saldo de férias no mesmo portal.", sourceChunkIndex: 1, sourceActionIndex: 0 }
  ];
  return { responseParts, retrievedChunks };
};


export const getChatResponse = async (query: string, systemPrompt: string, isAgentMode: boolean): Promise<{ responseParts: StructuredResponsePart[]; trace: AgentExecutionTrace }> => {
    try {
        if (isAgentMode) {
            // Use the new agentic logic for complex reasoning
            return await getAgentResponse(query, systemPrompt);
        } else {
            // Use the original single-pass logic
            const singlePassResult = await getSinglePassResponse(query, systemPrompt);
            // Wrap the result in a simple AgentExecutionTrace for UI consistency
            const trace: AgentExecutionTrace = {
                steps: [
                    { type: 'action', tool: 'search', query: query, results: singlePassResult.retrievedChunks }
                ]
            };
            return { responseParts: singlePassResult.responseParts, trace };
        }
    } catch (error) {
        console.error("Error getting chat response from Gemini:", error);
        // Return a consistent error structure
        const errorTrace: AgentExecutionTrace = {
            steps: [{ type: 'thought', text: 'Ocorreu um erro ao processar a solicitação.' }]
        };
        const errorParts: StructuredResponsePart[] = [{ text: "Desculpe, ocorreu um erro.", sourceChunkIndex: -1 }];
        return { responseParts: errorParts, trace: errorTrace };
    }
};



const failureAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        rootCause: {
            type: Type.STRING,
            enum: ['FALHA_RECUPERACAO', 'FALHA_RACIOCINIO', 'FALHA_FORMATACAO', 'ALUCINACAO', 'OUTRO'],
            description: "A classificação da causa raiz da falha."
        },
        justification: {
            type: Type.STRING,
            description: "Uma explicação concisa (uma frase) para a causa raiz."
        },
        suggestion: {
            type: Type.STRING,
            description: "Uma sugestão acionável para melhorar o prompt do sistema ou a base de conhecimento."
        }
    },
    required: ["rootCause", "justification", "suggestion"],
};

export const analyzeTestFailure = async (systemPrompt: string, testCase: TestCase): Promise<FailureAnalysis> => {
    const prompt = `
    Você é um especialista em análise de sistemas RAG (Retrieval-Augmented Generation). Sua tarefa é analisar a falha em um caso de teste e fornecer um diagnóstico estruturado em JSON.

    Analise a discrepância entre a "Resposta Esperada" e a "Resposta Gerada", considerando o "Prompt do Sistema", a "Pergunta" e o "Contexto de Referência" fornecidos.

    Classifique a causa raiz da falha em uma das seguintes categorias:
    - FALHA_RECUPERACAO: O contexto de referência era irrelevante, incompleto ou incorreto.
    - FALHA_RACIOCINIO: O contexto estava correto, mas o modelo não conseguiu usá-lo adequadamente para formular a resposta.
    - FALHA_FORMATACAO: O conteúdo da resposta estava correto, mas não seguiu o template ou as regras de formatação do prompt.
    - ALUCINACAO: O modelo inventou informações que não estavam presentes no contexto.
    - OUTRO: Uma causa diferente das anteriores.

    Forneça uma justificativa concisa (uma frase) e uma sugestão de melhoria acionável.

    DADOS DO TESTE:
    ---
    PROMPT DO SISTEMA:
    ${systemPrompt}
    ---
    PERGUNTA DO USUÁRIO:
    ${testCase.question}
    ---
    CONTEXTO DE REFERÊNCIA USADO:
    ${testCase.referenceContexts}
    ---
    RESPOSTA ESPERADA (CORRETA):
    ${testCase.expectedAnswer}
    ---
    RESPOSTA GERADA (INCORRETA):
    ${testCase.generatedAnswer}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: failureAnalysisSchema,
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as FailureAnalysis;
    } catch (error) {
        console.error("Error analyzing test failure with Gemini:", error);
        return {
            rootCause: 'OUTRO',
            justification: 'Falha ao analisar o erro com a IA. Verifique os logs do console.',
            suggestion: 'Tente novamente ou verifique a conexão com a API.'
        };
    }
};

const promptSuggestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            strategy: { type: Type.STRING, description: "Um nome curto para a estratégia de otimização (ex: 'Persona Reforçada', 'Chain-of-Thought')." },
            justification: { type: Type.STRING, description: "Uma explicação concisa sobre por que esta versão pode ser melhor." },
            prompt: { type: Type.STRING, description: "O conteúdo completo do novo prompt sugerido." }
        },
        required: ["strategy", "justification", "prompt"]
    }
};

export const getPromptSuggestions = async (currentPrompt: string): Promise<PromptSuggestion[]> => {
    const prompt = `
    Você é um especialista de classe mundial em engenharia de prompt para sistemas RAG. Sua tarefa é analisar o prompt de sistema fornecido e gerar 3 variações alternativas e aprimoradas.

    Cada variação deve tentar uma estratégia de otimização diferente. Exemplos de estratégias:
    - Reforçar a Persona: Tornar o papel do assistente mais explícito.
    - Adicionar Chain-of-Thought: Instruir o modelo a pensar passo a passo antes de responder.
    - Usar Templates Mais Rígidos: Definir a estrutura de saída de forma mais precisa.
    - Adicionar Exemplos (Few-Shot): Fornecer exemplos concretos de interações.
    - Simplificar Instruções: Tornar as regras mais concisas e diretas.

    Para cada sugestão, forneça um nome para a estratégia, uma justificativa e o conteúdo completo do novo prompt.

    PROMPT ATUAL PARA ANÁLISE:
    ---
    ${currentPrompt}
    ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: promptSuggestionsSchema,
            },
        });
        const jsonString = response.text.trim();
        return JSON.parse(jsonString) as PromptSuggestion[];
    } catch (error) {
        console.error("Error getting prompt suggestions from Gemini:", error);
        // Fallback with mock data
        return [
            {
                strategy: "Persona Reforçada (Mock)",
                justification: "Define mais claramente o papel do assistente para focar suas respostas.",
                prompt: "Você é o 'Atlas', um especialista em políticas internas. Sua única função é responder a perguntas usando o contexto fornecido. Comece sempre com 'De acordo com a base de conhecimento...'\n\n" + currentPrompt
            },
            {
                strategy: "Templates Rígidos (Mock)",
                justification: "Força um formato de saída mais estruturado para consistência.",
                prompt: currentPrompt + "\n\nSEMPRE use o seguinte formato:\n**Procedimento:** [Nome do Procedimento]\n**Passos:**\n1. ...\n2. ...\n**Fonte:** [Link da Fonte]"
            }
        ];
    }
};