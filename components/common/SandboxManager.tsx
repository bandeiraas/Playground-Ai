import React from 'react';
import { Sandbox } from '../../types';
import Button from './Button';

interface SandboxManagerProps {
    sandboxes: Sandbox[];
    activeSandboxId: string;
    onSelectSandbox: (id: string) => void;
    onCreateSandbox: () => void;
    onSetBaseline: (id: string) => void;
}

const SandboxManager: React.FC<SandboxManagerProps> = ({ sandboxes, activeSandboxId, onSelectSandbox, onCreateSandbox, onSetBaseline }) => {
    
    const getStatusClass = (status: Sandbox['status']) => {
        return status === 'Pronto' ? 'bg-green-500' : 'bg-yellow-500 animate-pulse';
    };

    const timeSince = (dateString: string) => {
        const date = new Date(dateString);
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return `${Math.floor(interval)}a`;
        interval = seconds / 2592000;
        if (interval > 1) return `${Math.floor(interval)}m`;
        interval = seconds / 86400;
        if (interval > 1) return `${Math.floor(interval)}d`;
        interval = seconds / 3600;
        if (interval > 1) return `${Math.floor(interval)}h`;
        interval = seconds / 60;
        if (interval > 1) return `${Math.floor(interval)}min`;
        return `${Math.floor(seconds)}s`;
    }

    return (
        <div className="bg-gray-800/70 rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-gray-300">Sandboxes</h3>
                <Button onClick={onCreateSandbox} variant="secondary" className="!px-2 !py-1 text-sm">
                    <i className="fas fa-plus mr-1"></i> Nova
                </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {sandboxes.map(sandbox => (
                    <div 
                        key={sandbox.id}
                        onClick={() => onSelectSandbox(sandbox.id)}
                        className={`p-3 rounded-md cursor-pointer border-2 transition-all ${activeSandboxId === sandbox.id ? 'border-cyan-500 bg-gray-700/80' : 'border-transparent bg-gray-700/40 hover:bg-gray-700/60'}`}
                    >
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                {sandbox.isBaseline && <i className="fas fa-star text-yellow-400" title="Baseline"></i>}
                                <h4 className="font-bold text-sm text-gray-200 break-all">{sandbox.name}</h4>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onSetBaseline(sandbox.id); }}
                                    className={`text-xs transition-colors ${sandbox.isBaseline ? 'text-yellow-400' : 'text-gray-500 hover:text-yellow-400'}`}
                                    title={sandbox.isBaseline ? "Remover como Baseline" : "Definir como Baseline"}
                                >
                                    <i className="fas fa-star"></i>
                                </button>
                                <span className={`flex-shrink-0 w-2 h-2 rounded-full ${getStatusClass(sandbox.status)}`} title={sandbox.status}></span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Atualizado há {timeSince(sandbox.updatedAt)}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SandboxManager;