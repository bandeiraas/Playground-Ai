import React, { useState, useMemo, useEffect } from 'react';
import { KnowledgeBaseVersion } from '../types';
import Card from './common/Card';
import Button from './common/Button';

// Mock content based on KB name
const MOCK_DOCUMENTS: Record<string, { id: string, title: string, content: string }[]> = {
    'kbv-1': [ // Financeiro
        { id: 'doc-fin-1', title: 'PROC_FIN_001: Adiantamento', content: 'Para solicitar um adiantamento salarial, o colaborador deve preencher o formulário F-12 disponível na intranet. O formulário deve ser aprovado pelo gestor direto. O prazo para solicitação é até o dia 15 de cada mês. O valor máximo do adiantamento é de 40% do salário base. A aprovação final é feita pelo departamento Financeiro em até 3 dias úteis. Após a aprovação, o valor é creditado na conta do colaborador no próximo dia útil. Lembre-se que descontos de INSS e IRRF podem ser aplicados sobre o valor adiantado, conforme a legislação vigente.' },
        { id: 'doc-fin-2', title: 'PROC_FIN_002: Reembolso', content: 'O processo de reembolso de despesas de viagem deve ser iniciado em até 5 dias após o retorno. O colaborador deve acessar o sistema de Despesas e anexar todas as notas fiscais digitalizadas. As despesas elegíveis incluem transporte, hospedagem e alimentação, dentro dos limites estabelecidos na política P-FIN-03. Despesas com álcool não são reembolsáveis. O gestor direto aprova a solicitação, que é então processada pelo Financeiro em até 10 dias úteis.' },
    ],
    'kbv-2': [ // RH
        { id: 'doc-rh-1', title: 'PROC_RH_004: Férias', content: 'A solicitação de férias deve ser feita com no mínimo 30 dias de antecedência. O colaborador deve negociar o período com seu gestor direto. O sistema de RH permite o agendamento e o acompanhamento da aprovação. É possível vender até 1/3 do período de férias. O pagamento correspondente às férias é realizado até 2 dias antes do início do período de descanso. A legislação trabalhista deve ser sempre consultada para casos específicos.' },
        { id: 'doc-rh-2', title: 'PROC_RH_005: Home Office', content: 'A política de home office permite até 3 dias de trabalho remoto por semana, mediante acordo com o gestor. O colaborador é responsável por garantir uma estação de trabalho ergonômica e uma conexão de internet estável. A empresa fornece um auxílio-custo mensal para despesas de internet e energia. O pedido para adesão ao modelo híbrido é feito via portal do colaborador e tem validade de 1 ano, podendo ser renovado.' },
    ],
    // Default mock
    'default': [
        { id: 'doc-def-1', title: 'Documento Padrão 1', content: 'Este é o primeiro parágrafo de um documento de exemplo. Ele serve para demonstrar como o texto é dividido em chunks. A estratégia de chunking é fundamental para o sucesso de um sistema RAG, pois define as unidades de informação que serão recuperadas. Uma boa divisão preserva o contexto semântico.' },
        { id: 'doc-def-2', title: 'Documento Padrão 2', content: 'Este é o segundo documento. Ele aborda um tópico diferente. A sobreposição de chunks (overlap) pode ser útil para garantir que frases importantes não sejam cortadas ao meio. No entanto, uma sobreposição muito grande pode criar redundância e poluir os resultados da busca vetorial. Encontrar o equilíbrio certo é a chave.' },
    ]
};

// Simple fixed-size chunking logic for the prototype
const chunkText = (text: string, chunkSize: number, overlap: number): string[] => {    
    if (!text || chunkSize <= 0) return [];
    const chunks: string[] = [];
    let i = 0;
    while (i < text.length) {
        const start = i;
        const end = Math.min(i + chunkSize, text.length);
        chunks.push(text.substring(start, end));
        const step = chunkSize - overlap;
        i += step > 0 ? step : chunkSize; // Prevent infinite loops if overlap is too large
    }
    return chunks;
};


interface ChunkingExplorerProps {
    kbVersion: KnowledgeBaseVersion | undefined;
    setView: (view: 'kb') => void;
}

const ChunkingExplorer: React.FC<ChunkingExplorerProps> = ({ kbVersion, setView }) => {
    const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
    
    // Chunking settings
    const [chunkSize, setChunkSize] = useState(256);
    const [overlap, setOverlap] = useState(32);
    // In a real app, this would trigger different functions. Here, we just use one.
    const [strategy, setStrategy] = useState('Fixed-Size'); 
    
    const documents = useMemo(() => {
        if (!kbVersion) return [];
        return MOCK_DOCUMENTS[kbVersion.id] || MOCK_DOCUMENTS['default'];
    }, [kbVersion]);
    
    useEffect(() => {
        if (documents.length > 0 && !selectedDocId) {
            setSelectedDocId(documents[0].id);
        }
    }, [documents, selectedDocId]);

    const selectedDocument = useMemo(() => {
        return documents.find(doc => doc.id === selectedDocId);
    }, [documents, selectedDocId]);

    const chunks = useMemo(() => {
        if (!selectedDocument) return [];
        return chunkText(selectedDocument.content, chunkSize, overlap);
    }, [selectedDocument, chunkSize, overlap, strategy]);

    if (!kbVersion) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-lg text-gray-400">Nenhuma Base de Conhecimento selecionada para explorar.</p>
                <Button onClick={() => setView('kb')} className="mt-4">
                    <i className="fas fa-arrow-left mr-2"></i>
                    Voltar para o Gerenciador
                </Button>
            </div>
        );
    }
    
    const chunkColors = ['bg-sky-900/50', 'bg-teal-900/50', 'bg-indigo-900/50', 'bg-rose-900/50', 'bg-purple-900/50', 'bg-emerald-900/50'];

    return (
        <div className="pt-16 h-screen flex flex-col">
            <div className="px-4 sm:px-6 lg:px-8 max-w-screen-2xl mx-auto w-full flex flex-col flex-grow min-h-0">
                <header className="py-6 flex-shrink-0">
                    <Button onClick={() => setView('kb')} variant="secondary" className="mb-4">
                        <i className="fas fa-arrow-left mr-2"></i>
                        Voltar para o Gerenciador
                    </Button>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">
                        <i className="fas fa-search-plus text-cyan-400 mr-4"></i>
                        Explorador de Chunking
                    </h1>
                    <p className="mt-1 text-lg text-gray-400">
                        Analise e otimize como os documentos da base <span className="font-bold text-cyan-300">{kbVersion.name}</span> são divididos.
                    </p>
                </header>

                <main className="flex-grow grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-0 overflow-y-auto pb-6">
                    {/* Controls and Doc List */}
                    <div className="lg:col-span-1 flex flex-col gap-6">
                        <Card title="Configurações de Chunking">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Estratégia</label>
                                    <select value={strategy} onChange={e => setStrategy(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white">
                                        <option>Fixed-Size</option>
                                        <option disabled>Recursive (em breve)</option>
                                        <option disabled>Semantic (em breve)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tamanho do Chunk (Caracteres)</label>
                                    <input type="range" min="64" max="2048" step="64" value={chunkSize} onChange={e => setChunkSize(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                    <div className="text-center font-mono text-cyan-400 mt-1">{chunkSize}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Sobreposição (Overlap)</label>
                                    <input type="range" min="0" max={Math.floor(chunkSize / 2)} step="16" value={overlap} onChange={e => setOverlap(parseInt(e.target.value, 10))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                                    <div className="text-center font-mono text-cyan-400 mt-1">{overlap}</div>
                                </div>
                            </div>
                        </Card>
                        <Card title="Documentos" className="flex-grow flex flex-col min-h-0">
                            <div className="overflow-y-auto space-y-2 p-4">
                                {documents.map(doc => (
                                    <div 
                                        key={doc.id}
                                        onClick={() => setSelectedDocId(doc.id)}
                                        className={`p-3 rounded-md cursor-pointer ${selectedDocId === doc.id ? 'bg-cyan-600/30 border border-cyan-500' : 'bg-gray-700/50 hover:bg-gray-700'}`}
                                    >
                                        <p className="font-semibold truncate">{doc.title}</p>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                    
                    {/* Chunk Visualizer */}
                    <div className="lg:col-span-3">
                        <Card title={`Visualizador de Chunks: ${selectedDocument?.title || ''}`} className="h-full">
                            <div className="p-6 h-full overflow-y-auto bg-gray-900 rounded-md border border-gray-700 leading-relaxed text-gray-300">
                                {chunks.length > 0 ? (
                                    <p className="whitespace-pre-wrap">
                                        {chunks.map((chunk, index) => (
                                            <span key={index} className={`relative p-2 m-1 rounded-md transition-colors duration-300 inline-block ${chunkColors[index % chunkColors.length]}`}>
                                                <span className="absolute -top-2 -left-2 bg-cyan-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-lg ring-2 ring-gray-900">{index + 1}</span>
                                                {chunk}
                                            </span>
                                        ))}
                                    </p>
                                ) : (
                                    <p className="text-gray-500">{selectedDocument?.content}</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ChunkingExplorer;