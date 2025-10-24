import React, { useState, useMemo } from 'react';
import { Sandbox, KnowledgeBaseVersion, PromptVersion, EvaluationResults } from '../types';
import Card from './common/Card';
import TooltipIcon from './common/TooltipIcon';

interface SandboxDashboardProps {
    sandboxes: Sandbox[];
    knowledgeBaseVersions: KnowledgeBaseVersion[];
    promptVersions: PromptVersion[];
}

const metricTooltips = {
    faithfulness: "Mede o quão factual a resposta é. Uma pontuação alta significa que a resposta se baseia estritamente nas informações do contexto fornecido, sem inventar fatos (alucinar).",
    answerRelevancy: "Avalia o quão relevante a resposta é para a pergunta do usuário. Uma pontuação alta indica que a resposta aborda diretamente o que foi perguntado, sem informações desnecessárias.",
    contextRecall: "Mede se todo o contexto relevante foi recuperado da base de conhecimento. Uma pontuação alta significa que o sistema encontrou todas as informações necessárias para dar uma resposta completa.",
    contextPrecision: "Avalia a proporção de contexto recuperado que é realmente útil. Uma pontuação alta indica que o sistema não trouxe muitos documentos irrelevantes junto com os úteis.",
};


const SandboxDashboard: React.FC<SandboxDashboardProps> = ({ sandboxes, knowledgeBaseVersions, promptVersions }) => {
    const [selectedSandboxIds, setSelectedSandboxIds] = useState<string[]>(sandboxes.slice(0, 2).map(s => s.id));

    const handleSelectionChange = (sandboxId: string) => {
        setSelectedSandboxIds(prev =>
            prev.includes(sandboxId)
                ? prev.filter(id => id !== sandboxId)
                : [...prev, sandboxId]
        );
    };

    const selectedSandboxes = useMemo(() => {
        return sandboxes.filter(s => selectedSandboxIds.includes(s.id));
    }, [sandboxes, selectedSandboxIds]);

    const getKbName = (id: string | null) => knowledgeBaseVersions.find(kb => kb.id === id)?.name || 'N/A';
    const getPromptName = (id: string | null) => promptVersions.find(p => p.id === id)?.name || 'Padrão';

    const renderMetric = (value: number | undefined) => {
        if (value === undefined || value === null) return <span className="text-gray-500">N/A</span>;
        let color = 'text-green-400';
        if (value < 0.9) color = 'text-yellow-400';
        if (value < 0.8) color = 'text-red-400';
        return <span className={`font-bold ${color}`}>{(value * 100).toFixed(1)}%</span>;
    }

    const renderStatus = (sandbox: Sandbox) => {
        if (sandbox.approvalSnapshot) {
            return <span className="px-2 py-1 text-xs font-semibold bg-blue-900/50 text-blue-300 rounded-full">Promovido</span>;
        }
        switch (sandbox.evaluationStatus) {
            case 'APPROVED':
                return <span className="px-2 py-1 text-xs font-semibold bg-green-900/50 text-green-400 rounded-full">Aprovado</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 text-xs font-semibold bg-red-900/50 text-red-400 rounded-full">Reprovado</span>;
            default:
                return <span className="px-2 py-1 text-xs font-semibold bg-yellow-900/50 text-yellow-400 rounded-full">Pendente</span>;
        }
    }

    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    <i className="fas fa-tachometer-alt text-cyan-400 mr-4"></i>
                    Dashboard Comparativo de Sandboxes
                </h1>
                <p className="mt-2 text-lg text-gray-400">
                    Selecione e compare a performance de diferentes experimentos lado a lado.
                </p>
            </header>

            <Card className="mb-8">
                <div className="p-6">
                    <h3 className="font-bold text-gray-300 mb-4">Selecione as Sandboxes para Comparar:</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {sandboxes.map(sandbox => (
                            <label key={sandbox.id} className={`flex items-center p-3 rounded-md cursor-pointer border-2 transition-all ${selectedSandboxIds.includes(sandbox.id) ? 'border-cyan-500 bg-gray-700/80' : 'border-transparent bg-gray-700/40 hover:bg-gray-700/60'}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedSandboxIds.includes(sandbox.id)}
                                    onChange={() => handleSelectionChange(sandbox.id)}
                                    className="h-5 w-5 rounded bg-gray-800 border-gray-600 text-cyan-500 focus:ring-cyan-600"
                                />
                                <span className="ml-3 text-gray-200 font-medium">{sandbox.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </Card>

            {selectedSandboxes.length > 0 ? (
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-gray-800">
                            <tr>
                                <th className="p-4 font-semibold text-gray-300 sticky left-0 bg-gray-800 w-48">Métrica</th>
                                {selectedSandboxes.map(sandbox => (
                                    <th key={sandbox.id} className="p-4 font-semibold text-cyan-300 text-center border-l border-gray-700">
                                        {sandbox.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800/50">
                            <tr className="bg-gray-900/50"><td colSpan={selectedSandboxes.length + 1} className="p-2 text-cyan-400 font-bold text-base">Configuração</td></tr>
                            <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48">Base de Conhecimento</td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{getKbName(s.selectedKbVersionId)}</td>)}
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48">Prompt A</td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{getPromptName(s.selectedPromptVersionId)}</td>)}
                            </tr>
                             <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48">Prompt B</td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{s.isComparing ? getPromptName(s.selectedPromptVersionIdB) : '-'}</td>)}
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48">Chunking</td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{s.chunkingStrategy}</td>)}
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48">Embedding</td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{s.embeddingModel}</td>)}
                            </tr>

                            <tr className="bg-gray-900/50"><td colSpan={selectedSandboxes.length + 1} className="p-2 text-cyan-400 font-bold text-base">Métricas de Avaliação (Prompt A)</td></tr>
                            <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48 flex items-center">Fidelidade <TooltipIcon text={metricTooltips.faithfulness} /></td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{renderMetric(s.evaluationResults?.faithfulness?.score)}</td>)}
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48 flex items-center">Relevância da Resposta <TooltipIcon text={metricTooltips.answerRelevancy} /></td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{renderMetric(s.evaluationResults?.answerRelevancy?.score)}</td>)}
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48 flex items-center">Abrangência do Contexto <TooltipIcon text={metricTooltips.contextRecall} /></td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{renderMetric(s.evaluationResults?.contextRecall?.score)}</td>)}
                            </tr>
                            <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48 flex items-center">Precisão do Contexto <TooltipIcon text={metricTooltips.contextPrecision} /></td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{renderMetric(s.evaluationResults?.contextPrecision?.score)}</td>)}
                            </tr>
                            
                             <tr className="bg-gray-900/50"><td colSpan={selectedSandboxes.length + 1} className="p-2 text-cyan-400 font-bold text-base">Governança</td></tr>
                             <tr>
                                <td className="p-3 font-medium text-gray-400 sticky left-0 bg-gray-800/50 w-48">Status Final</td>
                                {selectedSandboxes.map(s => <td key={s.id} className="p-3 text-center border-l border-gray-700">{renderStatus(s)}</td>)}
                            </tr>
                        </tbody>
                    </table>
                 </div>
            ) : (
                <div className="text-center text-gray-500 py-16">
                    <p>Selecione pelo menos uma sandbox para ver a comparação.</p>
                </div>
            )}
        </div>
    );
};

export default SandboxDashboard;