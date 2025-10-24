import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { TestCase } from '../../types';

interface ImportTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (testCases: Omit<TestCase, 'id'>[]) => void;
  showNotification: (message: string, isError?: boolean) => void;
}

const ImportTestsModal: React.FC<ImportTestsModalProps> = ({ isOpen, onClose, onImport, showNotification }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'api'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [fileData, setFileData] = useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  // FIX: The original type for `mappings` was too broad, requiring all properties from `TestCase`
  // even though only a subset is used for mapping. This caused type errors on initialization
  // and updates. By inferring the type from the initial value, we get a correct and specific type.
  const [mappings, setMappings] = useState({
    question: '',
    expectedAnswer: '',
    referenceContexts: '',
  });

  const handleFileChange = (uploadedFile: File) => {
    if (!uploadedFile) return;
    setFile(uploadedFile);
    parseFile(uploadedFile);
  };

  const parseFile = (fileToParse: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        let data: Record<string, string>[] = [];
        let detectedHeaders: string[] = [];

        if (fileToParse.type === 'application/json') {
          data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            detectedHeaders = Object.keys(data[0]);
          }
        } else { // Assume CSV
          const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
          if (lines.length < 2) throw new Error("CSV precisa de um cabeçalho e pelo menos uma linha de dados.");
          
          detectedHeaders = lines[0].split(',').map(h => h.trim());
          data = lines.slice(1).map(line => {
            const values = line.split(',');
            const row: Record<string, string> = {};
            detectedHeaders.forEach((header, index) => {
              row[header] = values[index]?.trim() || '';
            });
            return row;
          });
        }

        if (detectedHeaders.length === 0) throw new Error("Não foi possível extrair cabeçalhos do arquivo.");

        setHeaders(detectedHeaders);
        setFileData(data);
        showNotification(`Arquivo "${fileToParse.name}" processado com sucesso.`);
        
        // Auto-map common names
        const newMappings = { ...mappings };
        for (const header of detectedHeaders) {
            const lowerHeader = header.toLowerCase();
            if ((lowerHeader.includes('question') || lowerHeader.includes('pergunta')) && !newMappings.question) {
                newMappings.question = header;
            }
            if ((lowerHeader.includes('answer') || lowerHeader.includes('resposta')) && !newMappings.expectedAnswer) {
                newMappings.expectedAnswer = header;
            }
            if ((lowerHeader.includes('context') || lowerHeader.includes('contexto')) && !newMappings.referenceContexts) {
                newMappings.referenceContexts = header;
            }
        }
        setMappings(newMappings);

      } catch (err) {
        showNotification("Erro ao processar o arquivo. Verifique o formato.", true);
        console.error(err);
      }
    };
    reader.readAsText(fileToParse);
  };

  const handleMappingChange = (field: keyof typeof mappings, value: string) => {
    setMappings(prev => ({ ...prev, [field]: value }));
  };

  const handleConfirmImport = () => {
    if (!mappings.question || !mappings.expectedAnswer) {
      showNotification("Mapeamento para 'Pergunta' e 'Resposta Esperada' é obrigatório.", true);
      return;
    }

    const importedCases = fileData.map(row => ({
      question: row[mappings.question] || '',
      expectedAnswer: row[mappings.expectedAnswer] || '',
      referenceContexts: row[mappings.referenceContexts] || '',
    }));

    onImport(importedCases);
    resetState();
  };

  const resetState = () => {
    setFile(null);
    setFileData([]);
    setHeaders([]);
    setMappings({ question: '', expectedAnswer: '', referenceContexts: '' });
    onClose();
  };
  
  const MappingField: React.FC<{ field: keyof typeof mappings; label: string; required?: boolean }> = ({ field, label, required }) => (
      <div>
          <label className="block text-sm font-medium text-gray-400 mb-1">{label} {required && <span className="text-red-400">*</span>}</label>
          <select 
              value={mappings[field]} 
              onChange={e => handleMappingChange(field, e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white"
          >
              <option value="">-- Selecione a Coluna --</option>
              {headers.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
      </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={resetState} title="Importar Casos de Teste">
      <div className="space-y-4">
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-4" aria-label="Tabs">
            <button onClick={() => setActiveTab('file')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'file' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Upload de Arquivo</button>
            <button onClick={() => setActiveTab('api')} className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'api' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-gray-400 hover:text-gray-300'}`}>Conectar a API</button>
          </nav>
        </div>

        {activeTab === 'file' && (
          <div>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-cyan-500 hover:bg-gray-800/50 transition-colors">
              <input type="file" accept=".csv,.json" onChange={e => handleFileChange(e.target.files![0])} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <i className="fas fa-file-upload text-4xl text-gray-500 mb-4"></i>
                <h3 className="font-bold text-gray-300">{file ? `Arquivo: ${file.name}` : 'Arraste ou clique para upload'}</h3>
                <p className="text-sm text-gray-500 mt-1">Formatos suportados: CSV, JSON</p>
              </label>
            </div>
          </div>
        )}
        
        {activeTab === 'api' && (
             <div className="p-4 border border-dashed border-gray-600 rounded-lg text-center">
                <i className="fas fa-cogs text-4xl text-gray-500 mb-4"></i>
                <h3 className="font-bold text-gray-400">Funcionalidade de API</h3>
                <p className="text-sm text-gray-500 mt-1">A conexão com API será implementada em uma versão futura.</p>
             </div>
        )}

        {headers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h3 className="font-bold text-gray-300 mb-4">Mapeamento de Colunas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-900/50 rounded-lg">
                <MappingField field="question" label="Pergunta" required />
                <MappingField field="expectedAnswer" label="Resposta Esperada" required />
                <MappingField field="referenceContexts" label="Contextos de Ref." />
            </div>
            <h4 className="font-bold text-gray-400 text-sm my-2">Pré-visualização dos Dados Mapeados:</h4>
            <div className="max-h-40 overflow-y-auto bg-gray-900 p-2 rounded-md border border-gray-600 text-xs text-gray-400">
                <pre>
                    {JSON.stringify(fileData.slice(0, 3).map(row => ({
                        question: row[mappings.question],
                        expectedAnswer: row[mappings.expectedAnswer],
                        referenceContexts: row[mappings.referenceContexts],
                    })), null, 2)}
                </pre>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="secondary" onClick={resetState}>Cancelar</Button>
          <Button onClick={handleConfirmImport} disabled={fileData.length === 0}>
            Importar {fileData.length} Casos
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ImportTestsModal;
