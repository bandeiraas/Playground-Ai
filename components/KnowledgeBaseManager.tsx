import React, { useState, useRef, useMemo } from 'react';
import { KnowledgeBaseVersion, ValidationResult } from '../types';
import Card from './common/Card';
import Button from './common/Button';

interface KBManagerProps {
    versions: KnowledgeBaseVersion[];
    setVersions: React.Dispatch<React.SetStateAction<KnowledgeBaseVersion[]>>;
    showNotification: (message: string, isError?: boolean) => void;
    setView: (view: 'kb' | 'chunk-explorer') => void;
    setExploringKbId: (id: string) => void;
}

const MOCK_VALIDATION_RESULTS: ValidationResult[] = [
    { status: 'success', title: 'Estrutura JSON válida', description: 'Todos os campos obrigatórios estão presentes.' },
    { status: 'success', title: 'IDs únicos verificados', description: 'Procedimentos com IDs únicos válidos.' },
    { status: 'warning', title: 'Links não verificados', description: '3 procedimentos com links que precisam de verificação manual.' },
    { status: 'success', title: 'Palavras-chave presentes', description: 'Todos os procedimentos possuem palavras-chave.' },
    { status: 'error', title: 'Descrições muito curtas', description: '5 procedimentos com descrições abaixo do mínimo (50 caracteres).' },
];

const StatItem: React.FC<{ label: string; value: string | number; color?: string }> = ({ label, value, color = 'text-white' }) => (
    <div className="bg-gray-800 p-3 rounded-lg">
        <p className="text-sm text-gray-400">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
);


const KnowledgeBaseManager: React.FC<KBManagerProps> = ({ versions, setVersions, showNotification, setView, setExploringKbId }) => {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // A/B Test State
    const [versionAId, setVersionAId] = useState<string | undefined>(versions.find(v => v.status === 'PRODUÇÃO')?.id);
    const [versionBId, setVersionBId] = useState<string | undefined>(versions.find(v => v.status === 'TESTE A/B')?.id);

    const versionA = useMemo(() => versions.find(v => v.id === versionAId), [versions, versionAId]);
    const versionB = useMemo(() => versions.find(v => v.id === versionBId), [versions, versionBId]);

    const handleExplore = (versionId: string) => {
        setExploringKbId(versionId);
        setView('chunk-explorer');
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            setValidationResults([]);
            showNotification(`Arquivo "${file.name}" carregado.`, false);
        }
    };

    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };

    const handleValidate = () => {
        if (!uploadedFile) {
            showNotification("Por favor, carregue um arquivo primeiro.", true);
            return;
        }
        setIsProcessing(true);
        showNotification("Validação iniciada...", false);
        setTimeout(() => {
            setValidationResults(MOCK_VALIDATION_RESULTS);
            setIsProcessing(false);
            showNotification("Validação concluída!", false);
        }, 1500);
    };

    const handleCreateVersion = () => {
        if (!uploadedFile || validationResults.length === 0) {
            showNotification("Valide um arquivo antes de criar uma versão.", true);
            return;
        }
        
        const newVersionName = prompt("Digite um nome para a nova versão (ex: Base Financeiro v5.1):");
        if (!newVersionName) return;

        const newVersion: KnowledgeBaseVersion = {
            id: `kbv-${Date.now()}`,
            name: newVersionName,
            status: 'TESTE A/B',
            procedureCount: 130 + Math.floor(Math.random() * 10), // Mock count
            createdAt: new Date().toLocaleDateString('pt-BR'),
            author: 'Usuário Atual',
            file: uploadedFile,
            validationResults: validationResults,
            categoryCount: 8,
            accuracy: 85.0 + Math.random() * 5,
            avgResponseTime: 1.4 + Math.random() * 0.2,
        };

        setVersions(prev => [newVersion, ...prev]);
        showNotification(`Versão "${newVersionName}" criada com sucesso.`);
        setUploadedFile(null);
        setValidationResults([]);
    };
    
    const handleStatusChange = (id: string, newStatus: KnowledgeBaseVersion['status']) => {
        setVersions(versions.map(v => {
            // If we are setting a new version to Production, the old one becomes Archived
            if (v.status === 'PRODUÇÃO' && newStatus === 'PRODUÇÃO' && v.id !== id) {
                return { ...v, status: 'ARQUIVADA' };
            }
            if (v.id === id) {
                return { ...v, status: newStatus };
            }
            return v;
        }));
         showNotification(`Status da versão atualizado para ${newStatus}.`);
    }

    const getBadgeClass = (status: KnowledgeBaseVersion['status']) => ({
        "PRODUÇÃO": "bg-green-900/50 text-green-400",
        "TESTE A/B": "bg-cyan-900/50 text-cyan-400",
        "ARQUIVADA": "bg-yellow-900/50 text-yellow-400",
    }[status]);
    
    const getValidationItemClass = (status: ValidationResult['status']) => ({
        "success": "border-l-green-500",
        "warning": "border-l-yellow-500",
        "error": "border-l-red-500",
    }[status]);
    
    const getValidationIcon = (status: ValidationResult['status']) => ({
        "success": "fa-check-circle text-green-500",
        "warning": "fa-exclamation-triangle text-yellow-500",
        "error": "fa-times-circle text-red-500",
    }[status]);

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy > 85) return 'text-green-400';
        if (accuracy > 80) return 'text-yellow-400';
        return 'text-red-400';
    }


    return (
        <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    <i className="fas fa-database text-cyan-400 mr-4"></i>
                    Gerenciador de Base de Conhecimento
                </h1>
                <p className="mt-2 text-lg text-gray-400">
                    Gerencie, valide e versione suas bases de conhecimento para testes A/B.
                </p>
            </header>

            <main className="space-y-8">
                {/* Validador */}
                <Card title="Validador Automático de Template">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Upload e Preview */}
                        <div>
                             <div 
                                className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 hover:bg-gray-800/50 transition-colors"
                                onClick={triggerFileUpload}
                             >
                                <i className="fas fa-cloud-upload-alt text-4xl text-gray-500 mb-4"></i>
                                <h3 className="font-bold text-gray-300">
                                    {uploadedFile ? `Arquivo: ${uploadedFile.name}` : 'Arraste ou clique para upload'}
                                </h3>
                                <p className="text-sm text-gray-500 mt-1">Formatos: .json, .csv, .xlsx, .txt</p>
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json,.csv,.xlsx,.txt" className="hidden" />
                            </div>
                            <div className="mt-4 p-4 bg-gray-900 rounded-md border border-gray-700 font-mono text-xs text-gray-400 max-h-48 overflow-auto">
                                <pre>{`// Estrutura Esperada
{
  "procedimento_id": "PROC_XXX_YYY",
  "titulo": "Título do Procedimento",
  "descricao": "Descrição clara",
  "passos": ["Passo 1...", "Passo 2..."],
  "palavras_chave": ["key1", "key2"],
}`}</pre>
                            </div>
                        </div>
                        {/* Resultados */}
                        <div>
                             <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-300">Resultados da Validação</h3>
                                <Button onClick={handleValidate} disabled={!uploadedFile || isProcessing}>
                                    {isProcessing ? 'Validando...' : 'Validar Base'}
                                </Button>
                             </div>
                             <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 h-full min-h-[200px] max-h-80 overflow-y-auto">
                                {validationResults.length === 0 && <p className="text-gray-500 text-center mt-8">Aguardando validação...</p>}
                                <div className="space-y-2">
                                    {validationResults.map((item, index) => (
                                        <div key={index} className={`p-3 bg-gray-800 rounded-md border-l-4 ${getValidationItemClass(item.status)}`}>
                                            <p className="font-semibold text-gray-300 flex items-center gap-2">
                                                <i className={`fas ${getValidationIcon(item.status)}`}></i>
                                                {item.title}
                                            </p>
                                            <p className="text-sm text-gray-400 ml-6">{item.description}</p>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </Card>
                
                 {/* Versionamento */}
                 <Card title="Controle de Versões">
                    <div className="flex justify-end mb-4">
                        <Button onClick={handleCreateVersion} disabled={!uploadedFile || validationResults.filter(r => r.status === 'error').length > 0}>
                            <i className="fas fa-plus mr-2"></i>
                            Criar Nova Versão
                        </Button>
                    </div>
                     <div className="space-y-2">
                        {versions.map(version => (
                            <div key={version.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex items-center justify-between hover:border-cyan-500/50 transition-colors">
                                <div>
                                    <p className="font-bold text-gray-200 text-lg flex items-center gap-3">
                                        <i className="fas fa-database text-cyan-400"></i>
                                        {version.name}
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getBadgeClass(version.status)}`}>{version.status}</span>
                                    </p>
                                    <p className="text-sm text-gray-400 mt-1 ml-8">
                                        <span className="mr-4"><i className="fas fa-file-alt mr-1"></i> {version.procedureCount} procedimentos</span>
                                        <span className="mr-4"><i className="fas fa-calendar mr-1"></i> {version.createdAt}</span>
                                        <span><i className="fas fa-user mr-1"></i> {version.author}</span>
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                     <Button onClick={() => handleExplore(version.id)} variant="secondary" title="Explorar Conteúdo e Chunks">
                                        <i className="fas fa-search-plus"></i>
                                     </Button>
                                     {version.status !== 'PRODUÇÃO' && (
                                        <Button onClick={() => handleStatusChange(version.id, 'PRODUÇÃO')} variant="secondary" title="Promover para Produção"><i className="fas fa-arrow-up"></i></Button>
                                     )}
                                     {version.status !== 'TESTE A/B' && (
                                         <Button onClick={() => handleStatusChange(version.id, 'TESTE A/B')} variant="secondary" title="Marcar para Teste A/B"><i className="fas fa-flask"></i></Button>
                                     )}
                                      {version.status !== 'ARQUIVADA' && (
                                         <Button onClick={() => handleStatusChange(version.id, 'ARQUIVADA')} variant="secondary" title="Arquivar Versão"><i className="fas fa-archive"></i></Button>
                                     )}
                                </div>
                            </div>
                        ))}
                     </div>
                 </Card>

                 {/* Teste A/B */}
                 <Card title="Comparação A/B de Bases">
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Painel A */}
                        <div className="bg-gray-900/50 p-4 rounded-lg border-2 border-gray-700">
                             <h3 className="font-bold text-gray-300 mb-2">Versão A (Controle)</h3>
                             <select value={versionAId || ''} onChange={e => setVersionAId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                <option value="" disabled>Selecione a Versão A</option>
                                {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                             </select>
                             {versionA && (
                                 <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                                     <StatItem label="Procedimentos" value={versionA.procedureCount} />
                                     <StatItem label="Categorias" value={versionA.categoryCount} />
                                     <StatItem label="Acuracidade" value={`${versionA.accuracy.toFixed(1)}%`} color={getAccuracyColor(versionA.accuracy)} />
                                     <StatItem label="Tempo Médio" value={`${versionA.avgResponseTime.toFixed(1)}s`} />
                                 </div>
                             )}
                        </div>
                        {/* Painel B */}
                        <div className="bg-gray-900/50 p-4 rounded-lg border-2 border-gray-700">
                             <h3 className="font-bold text-gray-300 mb-2">Versão B (Teste)</h3>
                              <select value={versionBId || ''} onChange={e => setVersionBId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                <option value="" disabled>Selecione a Versão B</option>
                                {versions.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                             </select>
                             {versionB && (
                                 <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                                     <StatItem label="Procedimentos" value={versionB.procedureCount} />
                                     <StatItem label="Categorias" value={versionB.categoryCount} />
                                     <StatItem label="Acuracidade" value={`${versionB.accuracy.toFixed(1)}%`} color={getAccuracyColor(versionB.accuracy)} />
                                     <StatItem label="Tempo Médio" value={`${versionB.avgResponseTime.toFixed(1)}s`} />
                                 </div>
                             )}
                        </div>
                     </div>
                 </Card>
            </main>
        </div>
    );
};

export default KnowledgeBaseManager;