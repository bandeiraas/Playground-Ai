import React, { useState, useMemo } from 'react';
import Modal from './common/Modal';
import { RetrievedChunk } from '../types';

interface VectorSpaceExplorerProps {
  isOpen: boolean;
  onClose: () => void;
  userQuery: string;
  retrievedChunks: RetrievedChunk[];
}

interface Point {
  x: number;
  y: number;
  type: 'query' | 'retrieved' | 'almost' | 'irrelevant';
  data: {
    content: string;
    score?: number;
  };
}

const VectorSpaceExplorer: React.FC<VectorSpaceExplorerProps> = ({ isOpen, onClose, userQuery, retrievedChunks }) => {
  const [tooltip, setTooltip] = useState<{ x: number, y: number, content: string, score?: number } | null>(null);

  const points = useMemo<Point[]>(() => {
    if (!isOpen) return [];

    const width = 500;
    const height = 400;
    const center = { x: width / 2, y: height / 2 };

    const generatedPoints: Point[] = [];

    // 1. User Query
    generatedPoints.push({
      x: center.x,
      y: center.y,
      type: 'query',
      data: { content: userQuery },
    });

    // 2. Retrieved Chunks
    retrievedChunks.forEach(chunk => {
      const distance = (1 - chunk.similarityScore) * (width / 4); // Closer for higher scores
      const angle = Math.random() * 2 * Math.PI;
      generatedPoints.push({
        x: center.x + distance * Math.cos(angle),
        y: center.y + distance * Math.sin(angle),
        type: 'retrieved',
        data: { content: chunk.content, score: chunk.similarityScore },
      });
    });

    // 3. Mock "Almost" Retrieved Chunks
    for (let i = 0; i < 3; i++) {
      const score = (retrievedChunks[retrievedChunks.length - 1]?.similarityScore || 0.8) - (0.05 + Math.random() * 0.1);
      const distance = (1 - score) * (width / 3);
      const angle = Math.random() * 2 * Math.PI;
      generatedPoints.push({
        x: center.x + distance * Math.cos(angle),
        y: center.y + distance * Math.sin(angle),
        type: 'almost',
        data: { content: `(Chunk quase recuperado) Conteúdo de exemplo ${i + 1}...`, score },
      });
    }
    
    // 4. Mock "Irrelevant" Chunks
     for (let i = 0; i < 10; i++) {
      const score = Math.random() * 0.5;
      const distance = (width / 2) - Math.random() * 50; // Randomly spread out far from center
      const angle = Math.random() * 2 * Math.PI;
      generatedPoints.push({
        x: center.x + distance * Math.cos(angle),
        y: center.y + distance * Math.sin(angle),
        type: 'irrelevant',
        data: { content: `(Chunk irrelevante) Conteúdo de exemplo ${i + 1}...`, score },
      });
    }

    return generatedPoints;
  }, [isOpen, userQuery, retrievedChunks]);

  const pointColors = {
    query: 'fill-fuchsia-500',
    retrieved: 'fill-green-500',
    almost: 'fill-yellow-500',
    irrelevant: 'fill-gray-600',
  };

  const pointRadii = {
    query: 8,
    retrieved: 6,
    almost: 5,
    irrelevant: 4,
  };
  
  const handleMouseOver = (point: Point, event: React.MouseEvent) => {
    const rect = (event.target as SVGCircleElement).getBoundingClientRect();
    const modalContent = (event.target as SVGCircleElement).closest('.transform');
    if (!modalContent) return;

    const modalRect = modalContent.getBoundingClientRect();
    
    setTooltip({
      x: rect.left - modalRect.left,
      y: rect.top - modalRect.top,
      content: point.data.content,
      score: point.data.score,
    });
  };

  const handleMouseOut = () => {
    setTooltip(null);
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Explorador de Espaço Vetorial">
        <div className="relative">
            <p className="text-sm text-gray-400 mb-4">
                Esta é uma projeção 2D simulada do espaço de embedding. A distância visual representa a "proximidade semântica" entre a pergunta e os chunks de documento.
            </p>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 relative">
                <svg viewBox="0 0 500 400" className="w-full">
                    {points.map((point, i) => (
                        <circle
                            key={i}
                            cx={point.x}
                            cy={point.y}
                            r={pointRadii[point.type]}
                            className={`${pointColors[point.type]} cursor-pointer opacity-80 hover:opacity-100 hover:stroke-2 hover:stroke-white`}
                            onMouseOver={(e) => handleMouseOver(point, e)}
                            onMouseOut={handleMouseOut}
                        />
                    ))}
                </svg>
                 {tooltip && (
                    <div 
                        className="absolute p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-20 border border-gray-700 max-w-sm"
                        style={{ 
                            left: `${tooltip.x}px`,
                            top: `${tooltip.y}px`,
                            transform: 'translate(-50%, -110%)',
                            pointerEvents: 'none'
                        }}
                    >
                        {tooltip.score !== undefined && (
                            <p className="font-bold mb-1 text-cyan-400">Score: {tooltip.score.toFixed(3)}</p>
                        )}
                        <p className="whitespace-pre-wrap">{tooltip.content}</p>
                    </div>
                )}
            </div>
           
            <div className="flex justify-center items-center gap-6 mt-4 text-sm text-gray-400">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-fuchsia-500"></div><span>Pergunta</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Recuperados</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>Quase</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-600"></div><span>Irrelevantes</span></div>
            </div>
        </div>
    </Modal>
  );
};

export default VectorSpaceExplorer;
