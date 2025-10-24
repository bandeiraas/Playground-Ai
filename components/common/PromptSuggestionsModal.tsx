import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { PromptSuggestion } from '../../types';

interface PromptSuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  suggestions: PromptSuggestion[];
  onTestSuggestion: (suggestion: PromptSuggestion) => void;
}

const PromptSuggestionsModal: React.FC<PromptSuggestionsModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  suggestions,
  onTestSuggestion,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Otimizador de Prompt com IA">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <i className="fas fa-spinner fa-spin text-4xl text-cyan-400"></i>
          <p className="mt-4 text-gray-400">A IA está gerando variações do seu prompt...</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <p className="text-sm text-gray-400">
            A IA analisou seu prompt e gerou as seguintes variações. Cada uma usa uma estratégia de engenharia de prompt diferente. Teste-as para ver qual performa melhor.
          </p>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="font-bold text-cyan-400">{suggestion.strategy}</h3>
                      <p className="text-xs text-gray-400 mt-1">{suggestion.justification}</p>
                  </div>
                  <Button onClick={() => onTestSuggestion(suggestion)} className="!text-xs !py-1 !px-2 flex-shrink-0">
                      <i className="fas fa-box mr-2"></i>
                      Testar em Nova Sandbox
                  </Button>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <pre className="p-2 bg-gray-800 rounded-md text-xs text-gray-300 whitespace-pre-wrap max-h-32 overflow-y-auto font-mono">
                  <code>{suggestion.prompt}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default PromptSuggestionsModal;