import React, { useState, useEffect } from 'react';
import { PromptVersion, AnalysisReport, AnalysisItem, PromptSuggestion } from '../types';
import Button from './common/Button';
import { getPromptSuggestions } from '../services/geminiService';
import PromptSuggestionsModal from './common/PromptSuggestionsModal';

interface PromptAnalyzerProps {
    prompt: string;
    setPrompt: (value: string) => void;
    versions: PromptVersion[];
    selectedVersionId: string | null;
    onSelectVersion: (id: string) => void;
    onSaveVersion: (promptContent: string) => void;
    showNotification: (message: string, isError?: boolean) => void;
    onTestSuggestion: (suggestion: PromptSuggestion) => void;
}

type TargetModel = 'Gemini' | 'OpenAI' | 'Claude';

const MOCK_ANALYSIS_GEMINI: AnalysisReport = {
    generalScore: 8.7, qualityScore: 85,
    contextAnalysis: [
        { status: 'success', title: 'Contexto bem definido', description: 'O prompt estabelece claramente o papel (persona), escopo e domínio.' },
        { status: 'success', title: 'Instruções estruturadas', description: 'Diretrizes numeradas facilitam a compreensão do modelo.' },
        { status: 'warning', title: 'Adicionar exemplos (Few-shot)', description: 'Para Gemini, incluir exemplos de pergunta/resposta pode melhorar muito a performance.' },
    ],
    guardrailsAnalysis: [
        { status: 'success', title: 'Proteção contra manipulação', description: 'Instrui o modelo a identificar tentativas de prompt injection.' },
        { status: 'info', title: 'Especificar formato de saída', description: 'Considere usar JSON Schema para garantir um formato de saída consistente.' },
    ],
    bestPractices: [
        'Usa uma persona clara ("Você é o Atlas...")',
        'Define tom e linguagem apropriados',
        'Inclui tratamento de erros e casos de borda',
        'Instruções são claras e acionáveis',
    ],
    clarity: 90, completeness: 85, specificity: 75,
};

const MOCK_ANALYSIS_OPENAI: AnalysisReport = {
    generalScore: 8.2, qualityScore: 82,
    contextAnalysis: [
        { status: 'success', title: 'Instruções detalhadas', description: 'O prompt é detalhado e explícito, o que funciona bem com modelos GPT.' },
        { status: 'info', title: 'Considerar Delimitadores', description: 'Usar delimitadores como ### ou ``` para separar seções pode melhorar a clareza para o modelo.' },
        { status: 'success', title: 'Templates de Resposta Claros', description: 'O uso de templates ajuda a guiar o formato da saída.' },
    ],
    guardrailsAnalysis: [
        { status: 'success', title: 'Limitação de escopo', description: 'Define claramente o que está dentro e fora do escopo.' },
        { status: 'warning', title: 'Instruções Negativas', description: 'Evite frases como "Não invente fatos". Prefira instruções positivas como "Responda apenas com fatos da base".' },
    ],
    bestPractices: [
        'Instruções estão no início do prompt',
        'Define claramente a tarefa principal',
        'Especifica restrições e o que não fazer',
        'Usa exemplos para guiar a saída (few-shot)',
    ],
    clarity: 88, completeness: 90, specificity: 80,
};

const MOCK_ANALYSIS_CLAUDE: AnalysisReport = {
    generalScore: 9.1, qualityScore: 91,
    contextAnalysis: [
        { status: 'success', title: 'Uso de Tags XML', description: 'Modelos Claude respondem muito bem a prompts estruturados com tags XML, como <INSTRUCTIONS>.' },
        { status: 'success', title: 'Exemplos Claros', description: 'Os exemplos dentro das tags de template são uma forma eficaz de "few-shot prompting".' },
        { status: 'info', title: 'Posicionamento da Pergunta', description: 'A pergunta do usuário está bem posicionada no final, após todo o contexto e instruções.' },
    ],
    guardrailsAnalysis: [
        { status: 'success', title: 'Persona Pré-preenchida', description: 'Colocar a resposta do assistente no final do prompt (ex: <FINAL_ANSWER>) é uma técnica poderosa para guiar a saída.' },
        { status: 'success', title: 'Instruções de Segurança Robustas', description: 'As diretrizes de segurança são claras e cobrem os principais riscos.' },
    ],
    bestPractices: [
        'Estruturação com tags XML',
        'Exemplos "few-shot" bem definidos',
        'Instruções claras e hierárquicas',
        'Técnica de "pre-filling" da resposta',
    ],
    clarity: 95, completeness: 92, specificity: 88,
};


const getScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-400';
    if (score >= 7) return 'text-cyan-400';
    if (score >= 5) return 'text-yellow-400';
    return 'text-red-400';
};

const getProgressColor = (value: number) => {
    if (value >= 85) return 'bg-green-500';
    if (value >= 70) return 'bg-cyan-500';
    return 'bg-yellow-500';
};

const getAnalysisItemClass = (status: AnalysisItem['status']) => ({
    "success": "border-l-green-500",
    "warning": "border-l-yellow-500",
    "error": "border-l-red-500",
    "info": "border-l-cyan-500",
}[status]);

const getAnalysisIcon = (status: AnalysisItem['status']) => ({
    "success": "fa-check-circle text-green-500",
    "warning": "fa-exclamation-triangle text-yellow-500",
    "error": "fa-times-circle text-red-500",
    "info": "fa-info-circle text-cyan-500",
}[status]);


const PromptAnalyzer: React.FC<PromptAnalyzerProps> = ({ prompt, setPrompt, versions, selectedVersionId, onSelectVersion, onSaveVersion, showNotification, onTestSuggestion }) => {
    const [analysis, setAnalysis] = useState<AnalysisReport | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [lineCount, setLineCount] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [targetModel, setTargetModel] = useState<TargetModel>('Gemini');

    // State for optimization modal
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [suggestions, setSuggestions] = useState<PromptSuggestion[]>([]);
    const [isSuggestionsModalOpen, setIsSuggestionsModalOpen] = useState(false);

    useEffect(() => {
        setLineCount(prompt.split('\n').length);
        setCharCount(prompt.length);
    }, [prompt]);

    const handleAnalyze = () => {
        setIsAnalyzing(true);
        setAnalysis(null);
        showNotification(`Analisando prompt para ${targetModel}...`);
        
        setTimeout(() => {
            let report;
            switch (targetModel) {
                case 'OpenAI':
                    report = MOCK_ANALYSIS_OPENAI;
                    break;
                case 'Claude':
                    report = MOCK_ANALYSIS_CLAUDE;
                    break;
                case 'Gemini':
                default:
                    report = MOCK_ANALYSIS_GEMINI;
                    break;
            }
            setAnalysis(report);
            setIsAnalyzing(false);
            showNotification(`Análise concluída! Score: ${report.generalScore}/10`);
        }, 1500);
    };

    const handleOptimize = async () => {
        setIsOptimizing(true);
        setSuggestions([]);
        setIsSuggestionsModalOpen(true);
        try {
            const result = await getPromptSuggestions(prompt);
            setSuggestions(result);
        } catch (error) {
            showNotification("Falha ao obter sugestões da IA.", true);
            console.error(error);
            setIsSuggestionsModalOpen(false); // Close modal on error
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleTestAndClose = (suggestion: PromptSuggestion) => {
        onTestSuggestion(suggestion);
        setIsSuggestionsModalOpen(false);
    };

    // Re-run analysis if the model is changed and an analysis is already displayed
    useEffect(() => {
        if (analysis) {
            handleAnalyze();
        }
    }, [targetModel]);


    return (
        <div className="flex h-screen pt-16 bg-gray-900">
            {/* Editor Panel */}
            <div className="flex-1 flex flex-col border-r border-gray-700">
                <div className="flex-shrink-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-300 flex items-center gap-2"><i className="fas fa-code text-cyan-400"></i> Editor de Prompt</h2>
                    <span className="font-mono text-sm text-gray-400">
                        Linhas: {lineCount} | Caracteres: {charCount}
                    </span>
                </div>
                <div className="flex-grow relative">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Cole seu prompt aqui para análise..."
                        className="w-full h-full p-4 bg-gray-900 text-gray-300 resize-none border-none outline-none font-mono text-sm leading-relaxed"
                    />
                </div>
            </div>

            {/* Analysis Panel */}
            <div className="w-full md:w-[450px] lg:w-[500px] flex-shrink-0 flex flex-col bg-gray-800/50">
                <div className="flex-shrink-0 bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-300 flex items-center gap-2"><i className="fas fa-chart-line text-cyan-400"></i> Análise de Qualidade</h2>
                    <div className="flex gap-2">
                         <Button onClick={handleOptimize} variant="secondary" disabled={isOptimizing} title="Otimizar com IA">
                            <i className="fas fa-magic"></i>
                        </Button>
                        <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                            {isAnalyzing ? "Analisando..." : "Analisar"}
                        </Button>
                    </div>
                </div>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {/* Model Selector */}
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                        <label className="font-bold text-gray-300 mb-3 flex items-center gap-2" htmlFor="model-selector">
                            <i className="fas fa-bullseye"></i>Modelo de Destino
                        </label>
                        <select
                            id="model-selector"
                            value={targetModel}
                            onChange={(e) => setTargetModel(e.target.value as TargetModel)}
                            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="Gemini">Gemini (Google)</option>
                            <option value="OpenAI">GPT-4 (OpenAI)</option>
                            <option value="Claude">Claude 3 (Anthropic)</option>
                        </select>
                    </div>

                    {!analysis && (
                        <div className="text-center text-gray-500 pt-8">
                            <i className="fas fa-search-plus text-4xl mb-4"></i>
                            <p>Selecione um modelo e clique em "Analisar" para ver o feedback de qualidade.</p>
                        </div>
                    )}
                    {analysis && (
                        <>
                            {/* Score Overview */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-800 rounded-lg text-center border border-gray-700">
                                    <p className="text-sm text-gray-400 uppercase">Score Geral</p>
                                    <p className={`text-4xl font-bold ${getScoreColor(analysis.generalScore)}`}>{analysis.generalScore.toFixed(1)}<span className="text-2xl text-gray-500">/10</span></p>
                                </div>
                                <div className="p-4 bg-gray-800 rounded-lg text-center border border-gray-700">
                                    <p className="text-sm text-gray-400 uppercase">Qualidade</p>
                                    <p className={`text-4xl font-bold ${getProgressColor(analysis.qualityScore).replace('bg-','text-')}`}>{analysis.qualityScore}%</p>
                                </div>
                            </div>

                            {/* Analysis Sections */}
                            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2"><i className="fas fa-book"></i>Análise de Contexto</h3>
                                <div className="space-y-2">
                                    {analysis.contextAnalysis.map((item, i) => (
                                        <div key={i} className={`p-2 bg-gray-900/50 rounded-md border-l-4 ${getAnalysisItemClass(item.status)}`}>
                                            <p className="font-semibold text-gray-300 flex items-center gap-2 text-sm"><i className={`fas ${getAnalysisIcon(item.status)}`}></i>{item.title}</p>
                                            <p className="text-xs text-gray-400 ml-6">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2"><i className="fas fa-shield-halved"></i>Guardrails de Segurança</h3>
                                <div className="space-y-2">
                                    {analysis.guardrailsAnalysis.map((item, i) => (
                                         <div key={i} className={`p-2 bg-gray-900/50 rounded-md border-l-4 ${getAnalysisItemClass(item.status)}`}>
                                            <p className="font-semibold text-gray-300 flex items-center gap-2 text-sm"><i className={`fas ${getAnalysisIcon(item.status)}`}></i>{item.title}</p>
                                            <p className="text-xs text-gray-400 ml-6">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                             <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2"><i className="fas fa-star"></i>Boas Práticas ({targetModel})</h3>
                                <ul className="space-y-1 text-sm text-gray-300">
                                    {analysis.bestPractices.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2"><i className="fas fa-check text-green-500 mt-1"></i><span>{item}</span></li>
                                    ))}
                                </ul>
                             </div>

                             <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2"><i className="fas fa-chart-bar"></i>Métricas de Complexidade</h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <div className="flex justify-between mb-1"><span>Clareza</span><span className="font-semibold">{analysis.clarity}%</span></div>
                                        <div className="w-full bg-gray-700 rounded-full h-2"><div className={`h-2 rounded-full ${getProgressColor(analysis.clarity)}`} style={{width: `${analysis.clarity}%`}}></div></div>
                                    </div>
                                     <div>
                                        <div className="flex justify-between mb-1"><span>Completude</span><span className="font-semibold">{analysis.completeness}%</span></div>
                                        <div className="w-full bg-gray-700 rounded-full h-2"><div className={`h-2 rounded-full ${getProgressColor(analysis.completeness)}`} style={{width: `${analysis.completeness}%`}}></div></div>
                                    </div>
                                     <div>
                                        <div className="flex justify-between mb-1"><span>Especificidade</span><span className="font-semibold">{analysis.specificity}%</span></div>
                                        <div className="w-full bg-gray-700 rounded-full h-2"><div className={`h-2 rounded-full ${getProgressColor(analysis.specificity)}`} style={{width: `${analysis.specificity}%`}}></div></div>
                                    </div>
                                </div>
                             </div>

                             {/* Version Management */}
                             <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                                <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2"><i className="fas fa-code-branch"></i>Controle de Versão</h3>
                                <select 
                                    value={selectedVersionId || ''}
                                    onChange={(e) => onSelectVersion(e.target.value)}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-2"
                                    disabled={versions.length === 0}
                                >
                                    <option value="" disabled>-- Carregar uma versão --</option>
                                    {versions.map(v => (
                                        <option key={v.id} value={v.id}>{v.name}</option>
                                    ))}
                                </select>
                                <Button onClick={() => onSaveVersion(prompt)} variant="secondary" className="w-full">
                                    <i className="fas fa-save mr-2"></i>
                                    Salvar Como Nova Versão
                                </Button>
                             </div>
                        </>
                    )}
                </div>
            </div>
             <PromptSuggestionsModal 
                isOpen={isSuggestionsModalOpen}
                onClose={() => setIsSuggestionsModalOpen(false)}
                isLoading={isOptimizing}
                suggestions={suggestions}
                onTestSuggestion={handleTestAndClose}
            />
        </div>
    );
};

export default PromptAnalyzer;