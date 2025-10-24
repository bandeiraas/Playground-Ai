import React from 'react';
import Button from './common/Button';
import { PromptVersion } from '../types';

interface Phase2Props {
  systemPrompt: string;
  onSystemPromptChange: (prompt: string) => void;
  promptVersions: PromptVersion[];
  selectedPromptVersionId: string | null;
  onSaveVersion: () => void;
  onSelectVersion: (id: string) => void;
  onDeleteVersion: (id: string) => void;
  // A/B Testing Props
  isComparing: boolean;
  onIsComparingChange: (isComparing: boolean) => void;
  systemPromptB: string;
  onSystemPromptBChange: (prompt: string) => void;
  selectedPromptVersionIdB: string | null;
  onSelectVersionB: (id: string) => void;
}

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (checked: boolean) => void }> = ({ checked, onChange }) => (
    <button
        type="button"
        className={`${
            checked ? 'bg-cyan-600' : 'bg-gray-600'
        } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800`}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
    >
        <span
            aria-hidden="true"
            className={`${
                checked ? 'translate-x-5' : 'translate-x-0'
            } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
        />
    </button>
);


const PromptEditor: React.FC<{
    title: string;
    prompt: string;
    onPromptChange: (value: string) => void;
    versions: PromptVersion[];
    selectedVersionId: string | null;
    onSelectVersion: (id: string) => void;
    onSaveVersion?: () => void;
    onDeleteVersion: (id: string) => void;
}> = ({ title, prompt, onPromptChange, versions, selectedVersionId, onSelectVersion, onSaveVersion, onDeleteVersion }) => (
    <div>
        <h3 className="text-lg font-bold text-gray-300 mb-3">{title}</h3>
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="flex-grow">
                <label htmlFor={`prompt-versions-${title}`} className="block text-sm font-medium text-gray-400 mb-1">Versões Salvas</label>
                <select
                    id={`prompt-versions-${title}`}
                    value={selectedVersionId || ''}
                    onChange={(e) => onSelectVersion(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 h-10"
                    disabled={versions.length === 0}
                >
                    <option value="" disabled>-- Carregar uma versão --</option>
                    {versions.map(v => (
                        <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                </select>
            </div>
            <div className="flex gap-2 items-end">
                {onSaveVersion && (
                     <Button onClick={onSaveVersion} variant="secondary" className="h-10">
                        Salvar
                    </Button>
                )}
                <Button 
                    onClick={() => selectedVersionId && onDeleteVersion(selectedVersionId)} 
                    variant="secondary"
                    className="bg-red-800 hover:bg-red-900 focus:ring-red-700 h-10"
                    disabled={!selectedVersionId}
                >
                    Excluir
                </Button>
            </div>
        </div>
        <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={15}
            className="w-full bg-gray-900 border border-gray-600 rounded-md py-2 px-3 text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono text-sm"
        />
    </div>
);


const Phase2_PromptEngineering: React.FC<Phase2Props> = (props) => {
  return (
    <>
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-900/50 rounded-md">
            <label htmlFor="compare-mode" className="font-medium text-gray-300">Modo de Comparação (A/B Test)</label>
            <ToggleSwitch checked={props.isComparing} onChange={props.onIsComparingChange} />
        </div>

        <div className={`grid grid-cols-1 ${props.isComparing ? 'lg:grid-cols-2 gap-6' : ''}`}>
            <PromptEditor
                title={props.isComparing ? "Prompt A" : "Editor de Prompt"}
                prompt={props.systemPrompt}
                onPromptChange={props.onSystemPromptChange}
                versions={props.promptVersions}
                selectedVersionId={props.selectedPromptVersionId}
                onSelectVersion={props.onSelectVersion}
                onSaveVersion={props.onSaveVersion}
                onDeleteVersion={props.onDeleteVersion}
            />

            {props.isComparing && (
                <div className="border-t-2 border-dashed border-gray-700 lg:border-t-0 lg:border-l-2 lg:border-dashed lg:pl-6 pt-6 lg:pt-0">
                    <PromptEditor
                        title="Prompt B"
                        prompt={props.systemPromptB}
                        onPromptChange={props.onSystemPromptBChange}
                        versions={props.promptVersions}
                        selectedVersionId={props.selectedPromptVersionIdB}
                        onSelectVersion={props.onSelectVersionB}
                        onDeleteVersion={props.onDeleteVersion}
                    />
                </div>
            )}
        </div>
    </>
  );
};

export default Phase2_PromptEngineering;