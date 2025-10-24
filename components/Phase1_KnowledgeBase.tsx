import React from 'react';
import Select from './common/Select';
import Button from './common/Button';
import { KnowledgeBaseVersion } from '../types';

interface Phase1Props {
    chunkingStrategy: string;
    onChunkingStrategyChange: (strategy: string) => void;
    embeddingModel: string;
    onEmbeddingModelChange: (model: string) => void;
    knowledgeBaseVersions: KnowledgeBaseVersion[];
    selectedKbVersionId: string | null;
    onSelectedKbVersionIdChange: (id: string) => void;
}

const Phase1_KnowledgeBase: React.FC<Phase1Props> = ({
    chunkingStrategy,
    onChunkingStrategyChange,
    embeddingModel,
    onEmbeddingModelChange,
    knowledgeBaseVersions,
    selectedKbVersionId,
    onSelectedKbVersionIdChange,
}) => {
  const [message, setMessage] = React.useState<string | null>(null);

  const handleProcess = () => {
    setMessage("Configurações da base de conhecimento aplicadas com sucesso!");
    setTimeout(() => setMessage(null), 3000);
  };
  
  const activeVersions = knowledgeBaseVersions.filter(
    v => v.status === 'PRODUÇÃO' || v.status === 'TESTE A/B'
  );

  return (
    <>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-400 mb-1">Base de Conhecimento Ativa</label>
        <select
            value={selectedKbVersionId || ''}
            onChange={(e) => onSelectedKbVersionIdChange(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            disabled={activeVersions.length === 0}
        >
            <option value="" disabled>-- Selecione uma base --</option>
            {activeVersions.map((version) => (
                <option key={version.id} value={version.id}>
                    {version.name} ({version.status})
                </option>
            ))}
        </select>
        {activeVersions.length === 0 && <p className="text-xs text-yellow-400 mt-1">Nenhuma base de conhecimento ativa. Adicione uma no Gerenciador de Base de Conhecimento.</p>}
      </div>

      <Select
        label="Estratégia de Chunking"
        value={chunkingStrategy}
        onChange={(e) => onChunkingStrategyChange(e.target.value)}
        options={['Fixed-Size', 'Recursive Character', 'Semantic', 'Hierarchical']}
      />

      <Select
        label="Modelo de Embedding"
        value={embeddingModel}
        onChange={(e) => onEmbeddingModelChange(e.target.value)}
        options={['text-embedding-3-large (OpenAI)', 'gemini-embedding-001 (Google)', 'NV-Embed-v2 (NVIDIA)']}
      />
      <Button onClick={handleProcess} className="w-full mt-2" disabled={!selectedKbVersionId}>
        Aplicar Configurações
      </Button>
      {message && (
        <p className="text-green-400 text-sm mt-4 text-center">{message}</p>
      )}
    </>
  );
};

export default Phase1_KnowledgeBase;