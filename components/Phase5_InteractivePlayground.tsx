import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, AgentExecutionTrace, ActionStep, ExecutionStep, StructuredResponsePart } from '../types';
import { getChatResponse } from '../services/geminiService';
import Button from './common/Button';
import Modal from './common/Modal';
import VectorSpaceExplorer from './VectorSpaceExplorer';

interface ChatColumnProps {
    title: string;
    messages: ChatMessage[];
    diagnostics: AgentExecutionTrace | null;
    isLoading: boolean;
    onAddTestCase?: () => void;
}


const ExecutionTraceViewer: React.FC<{ trace: AgentExecutionTrace, lastUserQuery: string, message: ChatMessage | undefined }> = ({ trace, lastUserQuery, message }) => {
    const [highlightedSource, setHighlightedSource] = useState<{ actionIndex: number; chunkIndex: number } | null>(null);
    const [highlightedByChunk, setHighlightedByChunk] = useState<{ actionIndex: number; chunkIndex: number } | null>(null);

    const [isChunkModalOpen, setIsChunkModalOpen] = useState(false);
    const [selectedChunk, setSelectedChunk] = useState<ActionStep['results'][0] | null>(null);

    const [isExplorerOpen, setIsExplorerOpen] = useState(false);
    const [explorerData, setExplorerData] = useState<{ query: string; chunks: ActionStep['results'] } | null>(null);

    const handleChunkClick = (chunk: ActionStep['results'][0]) => {
        setSelectedChunk(chunk);
        setIsChunkModalOpen(true);
    };

    const handleOpenExplorer = (actionStep: ActionStep) => {
        setExplorerData({ query: actionStep.query, chunks: actionStep.results });
        setIsExplorerOpen(true);
    };

    const getScoreColor = (score: number) => score > 0.9 ? 'border-green-400' : score > 0.8 ? 'border-cyan-400' : 'border-yellow-500';

    const handleTextPartMouseEnter = (part: StructuredResponsePart) => {
        if (part.sourceChunkIndex !== -1 && part.sourceActionIndex !== undefined) {
          setHighlightedSource({ actionIndex: part.sourceActionIndex, chunkIndex: part.sourceChunkIndex });
        }
    };

    const handleTextPartMouseLeave = () => {
        setHighlightedSource(null);
    };

    const handleChunkMouseEnter = (actionIndex: number, chunkIndex: number) => {
        setHighlightedByChunk({ actionIndex, chunkIndex });
    };

    const handleChunkMouseLeave = () => {
        setHighlightedByChunk(null);
    };

    useEffect(() => {
    if (!message || !message.structuredText) return;

    // Use a map to handle multiple parts mapping to the same chunk
    const highlightMap = new Map<string, boolean>();
    if (highlightedByChunk) {
      const key = `${highlightedByChunk.actionIndex}-${highlightedByChunk.chunkIndex}`;
      highlightMap.set(key, true);
    }
    
    message.structuredText.forEach(part => {
        const element = document.getElementById(`part-${part.sourceActionIndex}-${part.sourceChunkIndex}`);
        if (element) {
            const key = `${part.sourceActionIndex}-${part.sourceChunkIndex}`;
            if (highlightMap.has(key)) {
                element.classList.add('bg-cyan-500/50', 'rounded-md');
            } else {
                element.classList.remove('bg-cyan-500/50', 'rounded-md');
            }
        }
    });

}, [highlightedByChunk, message]);



    return (
        <>
            <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {trace.steps.map((step, stepIndex) => (
                    <div key={stepIndex}>
                        {step.type === 'thought' && (
                            <div className="p-2 bg-gray-900/50 rounded-lg border-l-4 border-gray-500">
                                <p className="text-xs font-semibold text-gray-400 mb-1 flex items-center gap-2"><i className="fas fa-comment-dots"></i> Pensamento</p>
                                <p className="text-sm text-gray-300 italic">"{step.text}"</p>
                            </div>
                        )}
                        {step.type === 'action' && (
                            <div className="p-2 bg-gray-900/50 rounded-lg border-l-4 border-blue-500">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-2"><i className="fas fa-search"></i> Ação: Busca #{stepIndex}</p>
                                    <button onClick={() => handleOpenExplorer(step)} className="text-gray-400 hover:text-cyan-400 text-xs" title="Explorar Espaço Vetorial para esta Busca"><i className="fas fa-project-diagram"></i></button>
                                </div>
                                <p className="text-sm font-mono bg-gray-800 p-1 rounded-md mb-2">"{step.query}"</p>
                                {step.results.map((chunk, chunkIndex) => (
                                    <div 
                                        key={chunkIndex} 
                                        onClick={() => handleChunkClick(chunk)} 
                                        onMouseEnter={() => handleChunkMouseEnter(stepIndex, chunkIndex)}
                                        onMouseLeave={handleChunkMouseLeave}
                                        className={`bg-gray-800 p-2 mt-1 rounded-md border-l-4 cursor-pointer hover:bg-gray-700/50 transition-all ${getScoreColor(chunk.similarityScore)} ${highlightedSource?.actionIndex === stepIndex && highlightedSource?.chunkIndex === chunkIndex ? 'ring-2 ring-cyan-400' : ''}`}
                                    >
                                        <p className="text-xs text-cyan-400 truncate">{chunk.source}</p>
                                        <p className="text-xs text-gray-400 truncate mt-1">{chunk.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                         {step.type === 'synthesis' && (
                            <div className="p-2 bg-gray-900/50 rounded-lg border-l-4 border-purple-500">
                                <p className="text-xs font-semibold text-purple-400 mb-1 flex items-center gap-2"><i className="fas fa-cogs"></i> Síntese</p>
                                <p className="text-sm text-gray-300 italic">"{step.text}"</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {explorerData && <VectorSpaceExplorer isOpen={isExplorerOpen} onClose={() => setIsExplorerOpen(false)} userQuery={explorerData.query} retrievedChunks={explorerData.chunks} />}
            <Modal isOpen={isChunkModalOpen} onClose={() => setIsChunkModalOpen(false)} title={`Detalhes do Chunk: ${selectedChunk?.source}`}>
                {selectedChunk && (
                    <div className="space-y-2 text-sm">
                        <p><strong>Score de Similaridade:</strong> <span className="font-mono text-cyan-300">{selectedChunk.similarityScore.toFixed(4)}</span></p>
                        <p className="font-bold mt-2">Conteúdo Completo:</p>
                        <pre className="p-2 bg-gray-900 rounded-md text-xs text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto">
                            <code>{selectedChunk.content}</code>
                        </pre>
                    </div>
                )}
            </Modal>
        </>
    );
};

const ChatColumn: React.FC<ChatColumnProps> = ({ title, messages, diagnostics, isLoading, onAddTestCase }) => {
    const chatHistoryRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatHistoryRef.current) {
            chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
    }, [messages]);

    const lastUserQuery = [...messages].reverse().find(m => m.sender === 'user')?.text || "";
    const lastAiMessage = [...messages].reverse().find(m => m.sender === 'ai');

    const handleTextPartMouseEnter = (part: StructuredResponsePart) => {
        const element = document.querySelector(`[data-chunk-id="${part.sourceActionIndex}-${part.sourceChunkIndex}"]`);
        element?.classList.add('ring-2', 'ring-cyan-400');
    };

    const handleTextPartMouseLeave = (part: StructuredResponsePart) => {
        const element = document.querySelector(`[data-chunk-id="${part.sourceActionIndex}-${part.sourceChunkIndex}"]`);
        element?.classList.remove('ring-2', 'ring-cyan-400');
    };

    return (
        <div className="flex flex-col h-full bg-gray-800 rounded-lg">
            <h3 className="text-lg font-bold text-center py-2 text-cyan-400 border-b border-gray-700 flex-shrink-0">{title}</h3>
            <div className="flex flex-col flex-grow min-h-0">
                <div ref={chatHistoryRef} className="flex-grow overflow-y-auto p-4 bg-gray-900/50">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 mb-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-cyan-800 flex-shrink-0 self-start mt-1"><i className="fas fa-robot p-2"></i></div>}
                            <div className={`max-w-xl p-3 rounded-lg ${msg.sender === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                {msg.structuredText ? (
                                    <p>
                                        {msg.structuredText.map((part, i) => (
                                            <span 
                                                key={i} 
                                                id={`part-${part.sourceActionIndex}-${part.sourceChunkIndex}`}
                                                className="transition-all duration-200"
                                                onMouseEnter={() => handleTextPartMouseEnter(part)}
                                                onMouseLeave={() => handleTextPartMouseLeave(part)}
                                            >{part.text}</span>
                                        ))}
                                    </p>
                                ) : (
                                    <p>{msg.text}</p>
                                )}
                                {msg.sender === 'ai' && !isLoading && (
                                    <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-gray-600/50">
                                        {index === messages.length - 1 && onAddTestCase && (
                                            <button 
                                                onClick={onAddTestCase} 
                                                title="Adicionar como Caso de Teste na Fase III"
                                                className="text-xs text-gray-400 hover:text-green-400 transition-colors"
                                            >
                                                <i className="fas fa-plus-circle"></i> Adicionar aos Testes
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {isLoading && messages.length > 0 && messages[messages.length-1].sender === 'user' && (
                        <div className="flex items-end gap-2 mb-4 justify-start">
                            <div className="w-8 h-8 rounded-full bg-cyan-800 flex-shrink-0 self-start mt-1"><i className="fas fa-robot p-2"></i></div>
                            <div className="max-w-md p-3 rounded-lg bg-gray-700 text-gray-200">
                               <i className="fas fa-spinner fa-spin"></i>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 border-t border-gray-700 flex-shrink-0">
                    <h4 className="font-bold text-gray-400 text-sm mb-2">Rastro de Execução (Execution Trace)</h4>
                    {diagnostics ? <ExecutionTraceViewer trace={diagnostics} lastUserQuery={lastUserQuery} message={lastAiMessage} /> : <p className="text-sm text-gray-500">Aguardando pergunta...</p>}
                </div>
            </div>
        </div>
    );
};


interface Phase5Props {
    systemPromptA: string;
    systemPromptB: string;
    isComparing: boolean;
    onAddTestCase: (question: string, generatedAnswer: string, retrievedChunks: any[]) => void;
}

const Phase5_InteractivePlayground: React.FC<Phase5Props> = ({ systemPromptA, systemPromptB, isComparing, onAddTestCase }) => {
    const [messagesA, setMessagesA] = useState<ChatMessage[]>([]);
    const [diagnosticsA, setDiagnosticsA] = useState<AgentExecutionTrace | null>(null);
    
    const [messagesB, setMessagesB] = useState<ChatMessage[]>([]);
    const [diagnosticsB, setDiagnosticsB] = useState<AgentExecutionTrace | null>(null);

    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isAgentMode, setIsAgentMode] = useState(false);

    const handleCreateTestFromInteraction = (
        messages: ChatMessage[],
        diagnostics: AgentExecutionTrace | null
    ) => {
        const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
        const lastAiMsg = [...messages].reverse().find(m => m.sender === 'ai');
        const allChunks = diagnostics?.steps.filter(s => s.type === 'action').flatMap(s => (s as ActionStep).results) || [];
        
        if (lastUserMsg && lastAiMsg) {
            onAddTestCase(lastUserMsg.text, lastAiMsg.text, allChunks);
        }
    };

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const userMessage: ChatMessage = { sender: 'user', text: userInput };
        
        setMessagesA(prev => [...prev, userMessage]);
        if (isComparing) setMessagesB(prev => [...prev, userMessage]);

        const query = userInput;
        setUserInput('');
        setIsLoading(true);
        setDiagnosticsA(null);
        setDiagnosticsB(null);

        try {
            const callA = getChatResponse(query, systemPromptA, isAgentMode);
            const callB = isComparing ? getChatResponse(query, systemPromptB, isAgentMode) : Promise.resolve(null);

            const [resultA, resultB] = await Promise.all([callA, callB]);

            if(resultA) {
                const responseTextA = resultA.responseParts.map(p => p.text).join("");
                const aiMessageA: ChatMessage = { sender: 'ai', text: responseTextA, structuredText: resultA.responseParts };
                setMessagesA(prev => [...prev, aiMessageA]);
                setDiagnosticsA(resultA.trace);
            }

            if(resultB) {
                const responseTextB = resultB.responseParts.map(p => p.text).join("");
                const aiMessageB: ChatMessage = { sender: 'ai', text: responseTextB, structuredText: resultB.responseParts };
                setMessagesB(prev => [...prev, aiMessageB]);
                setDiagnosticsB(resultB.trace);
            }

        } catch (error) {
            console.error("Failed to get chat response:", error);
            const errorMessage: ChatMessage = { sender: 'ai', text: "Ocorreu um erro ao buscar a resposta." };
            setMessagesA(prev => [...prev, errorMessage]);
            if(isComparing) setMessagesB(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        setMessagesA([]);
        setMessagesB([]);
        setDiagnosticsA(null);
        setDiagnosticsB(null);
    }, [isComparing, systemPromptA, systemPromptB, isAgentMode]);

    return (
        <div className="flex flex-col h-full bg-gray-800/70 rounded-lg shadow-lg">
            <div className={`flex-grow grid ${isComparing ? 'grid-cols-1 lg:grid-cols-2 gap-4' : 'grid-cols-1'} min-h-0 p-4`}>
                <ChatColumn 
                    title={isComparing ? "Prompt A" : "Conversa"}
                    messages={messagesA}
                    diagnostics={diagnosticsA}
                    isLoading={isLoading}
                    onAddTestCase={() => handleCreateTestFromInteraction(messagesA, diagnosticsA)}
                />
                {isComparing && (
                    <ChatColumn 
                        title="Prompt B"
                        messages={messagesB}
                        diagnostics={diagnosticsB}
                        isLoading={isLoading}
                        onAddTestCase={() => handleCreateTestFromInteraction(messagesB, diagnosticsB)}
                    />
                )}
            </div>

            <div className="p-4 border-t border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-4">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Digite sua pergunta aqui..."
                        className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        disabled={isLoading}
                    />
                    <Button onClick={handleSendMessage} disabled={isLoading || !userInput.trim()}>
                        Enviar
                    </Button>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-600/50">
                    <label htmlFor="agent-mode" className="text-sm font-medium text-gray-400">Modo Agente de Raciocínio</label>
                    <input type="checkbox" id="agent-mode" checked={isAgentMode} onChange={e => setIsAgentMode(e.target.checked)} className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600" />
                </div>
            </div>
        </div>
    );
};

export default Phase5_InteractivePlayground;