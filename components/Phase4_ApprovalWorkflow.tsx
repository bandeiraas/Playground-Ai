import React, { useState, useEffect } from 'react';
import { EvaluationStatus, ApprovalSnapshot } from '../types';
import Button from './common/Button';
import TooltipIcon from './common/TooltipIcon';

interface Phase4Props {
  evaluationStatus: EvaluationStatus;
  snapshot: ApprovalSnapshot | null;
  onCreateSnapshot: () => boolean;
  isComparing: boolean;
}

const metricTooltips = {
    faithfulness: "Mede o quão factual a resposta é. Uma pontuação alta significa que a resposta se baseia estritamente nas informações do contexto fornecido, sem inventar fatos (alucinar).",
    answerRelevancy: "Avalia o quão relevante a resposta é para a pergunta do usuário. Uma pontuação alta indica que a resposta aborda diretamente o que foi perguntado, sem informações desnecessárias.",
    contextRecall: "Mede se todo o contexto relevante foi recuperado da base de conhecimento. Uma pontuação alta significa que o sistema encontrou todas as informações necessárias para dar uma resposta completa.",
    contextPrecision: "Avalia a proporção de contexto recuperado que é realmente útil. Uma pontuação alta indica que o sistema não trouxe muitos documentos irrelevantes junto com os úteis.",
};


const Phase4_ApprovalWorkflow: React.FC<Phase4Props> = ({ evaluationStatus, snapshot, onCreateSnapshot, isComparing }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [approvals, setApprovals] = useState({
    tech: false,
    business: false,
    risk: false,
  });
  const [isDeployed, setIsDeployed] = useState(false);

  const canSubmit = evaluationStatus === 'APPROVED';

  useEffect(() => {
    // Sync local state with snapshot from sandbox
    if (snapshot) {
      setIsSubmitted(true);
    } else {
      setIsSubmitted(false);
      setIsDeployed(false);
      setApprovals({ tech: false, business: false, risk: false });
    }
  }, [snapshot]);

  const handleSubmission = () => {
    if (canSubmit) {
      const success = onCreateSnapshot();
      if (success) {
        setIsSubmitted(true);
      }
    }
  };

  const handleApprovalChange = (stakeholder: keyof typeof approvals) => {
    setApprovals(prev => ({ ...prev, [stakeholder]: !prev[stakeholder] }));
  };

  const allApproved = Object.values(approvals).every(Boolean);

  const handleDeploy = () => {
    if(allApproved) {
        setIsDeployed(true);
    }
  }
  
  const SnapshotDetails: React.FC<{ snapshot: ApprovalSnapshot }> = ({ snapshot }) => (
    <div className="mt-4 p-4 bg-gray-900 rounded-md border border-dashed border-gray-600 space-y-3">
        <h4 className="font-bold text-gray-300 text-md border-b border-gray-700 pb-2 mb-3">Snapshot da Configuração Aprovada</h4>
        <div className="text-sm space-y-2 text-gray-400">
            <p><strong>Estratégia de Chunking:</strong> <span className="font-mono text-cyan-300">{snapshot.chunkingStrategy}</span></p>
            <p><strong>Modelo de Embedding:</strong> <span className="font-mono text-cyan-300">{snapshot.embeddingModel}</span></p>
            <div>
                <strong>Scores de Avaliação:</strong>
                <ul className="list-disc list-inside pl-4 font-mono text-green-300 space-y-1">
                    <li className="flex items-center">Fidelidade: {(snapshot.evaluationResults.faithfulness.score * 100).toFixed(0)}% <TooltipIcon text={metricTooltips.faithfulness} /></li>
                    <li className="flex items-center">Relevância da Resposta: {(snapshot.evaluationResults.answerRelevancy.score * 100).toFixed(0)}% <TooltipIcon text={metricTooltips.answerRelevancy} /></li>
                    <li className="flex items-center">Abrangência do Contexto: {(snapshot.evaluationResults.contextRecall.score * 100).toFixed(0)}% <TooltipIcon text={metricTooltips.contextRecall} /></li>
                    <li className="flex items-center">Precisão do Contexto: {(snapshot.evaluationResults.contextPrecision.score * 100).toFixed(0)}% <TooltipIcon text={metricTooltips.contextPrecision} /></li>
                </ul>
            </div>
            <div>
                 <strong>Prompt do Sistema:</strong>
                 <pre className="mt-1 p-2 bg-gray-800 rounded-md text-xs text-gray-300 whitespace-pre-wrap max-h-24 overflow-y-auto">
                    <code>{snapshot.systemPrompt}</code>
                 </pre>
            </div>
        </div>
    </div>
  );


  return (
    <>
       {isComparing && evaluationStatus !== 'PENDING' && (
            <div className="text-xs text-yellow-300 bg-yellow-900/50 p-2 rounded-md mb-4 text-center">
                Modo de comparação ativo. O fluxo de aprovação considerará apenas os resultados do <strong>Prompt A</strong>.
            </div>
        )}
      <Button onClick={handleSubmission} disabled={!canSubmit || isSubmitted} className="w-full">
        {isSubmitted ? 'Submetido para Aprovação' : 'Submeter para Aprovação'}
      </Button>

      {isSubmitted && (
        <div className="mt-6 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
          <h3 className="font-bold mb-3 text-gray-300">Painel de Aprovação</h3>
          
          {snapshot && <SnapshotDetails snapshot={snapshot} />}

          <div className="space-y-3 mt-4">
            <label className="flex items-center p-3 bg-gray-800 rounded-md hover:bg-gray-700/50 transition-colors">
              <input
                type="checkbox"
                checked={approvals.tech}
                onChange={() => handleApprovalChange('tech')}
                className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"
              />
              <span className="ml-3 text-gray-300">Revisão Técnica (Área de Tecnologia)</span>
            </label>
            <label className="flex items-center p-3 bg-gray-800 rounded-md hover:bg-gray-700/50 transition-colors">
              <input
                type="checkbox"
                checked={approvals.business}
                onChange={() => handleApprovalChange('business')}
                className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"
              />
              <span className="ml-3 text-gray-300">Revisão de Negócio (Owner da Base)</span>
            </label>
            <label className="flex items-center p-3 bg-gray-800 rounded-md hover:bg-gray-700/50 transition-colors">
              <input
                type="checkbox"
                checked={approvals.risk}
                onChange={() => handleApprovalChange('risk')}
                className="h-5 w-5 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"
              />
              <span className="ml-3 text-gray-300">Revisão de Risco e Compliance (Diretoria)</span>
            </label>
          </div>
          <Button onClick={handleDeploy} disabled={!allApproved || isDeployed} className="w-full mt-4">
            {isDeployed ? 'Implantado com Sucesso!' : 'Aprovar Implantação em Produção'}
          </Button>
        </div>
      )}
    </>
  );
};

export default Phase4_ApprovalWorkflow;