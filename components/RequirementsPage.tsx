import React from 'react';
import Button from './common/Button';

interface RequirementsPageProps {
  setView: (view: 'requirements' | 'playground') => void;
}

// Icon components for better visuals
const IconDatabase = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4M4 7s0 0 0 0" /></svg>;
const IconPencil = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" /></svg>;
const IconChecklist = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconShield = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconChat = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>;

const PhaseStep: React.FC<{ number: number; title: string; description: string; icon: React.ReactNode; isLast?: boolean }> = ({ number, title, description, icon, isLast = false }) => (
    <div className="relative flex items-start">
        {/* Timeline line */}
        {!isLast && <div className="absolute top-12 left-10 w-0.5 h-full bg-gray-700"></div>}
        
        {/* Step Number and Icon */}
        <div className="flex-shrink-0 flex flex-col items-center mr-6">
            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gray-800 border-2 border-cyan-500 text-cyan-400">
                {icon}
            </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 w-full hover:border-cyan-500/50 transition-colors duration-300">
            <h3 className="text-xl font-bold text-cyan-400 mb-2">
                <span className="text-gray-500 font-mono mr-2">FASE {number}</span>
                {title}
            </h3>
            <p className="text-gray-400">{description}</p>
        </div>
    </div>
);


const RequirementsPage: React.FC<RequirementsPageProps> = ({ setView }) => {
  return (
    <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <header className="text-center mb-16">
        <h1 className="text-5xl font-extrabold text-white tracking-tight">
          Atlas AI Playground
        </h1>
        <p className="mt-4 text-xl text-gray-400">
          Uma plataforma unificada para construir, avaliar e governar sistemas de IA confiáveis.
        </p>
      </header>

      <section className="mb-16">
        <div className="bg-gray-800/50 p-8 rounded-lg border border-gray-700">
          <h2 className="text-3xl font-bold text-center mb-2 text-cyan-400">O Desafio</h2>
          <p className="text-center text-gray-300 max-w-3xl mx-auto">
            Sistemas de Retrieval-Augmented Generation (RAG) são poderosos, mas complexos. Garantir que suas respostas sejam precisas, relevantes e livres de alucinações, ao mesmo tempo em que se mantém um fluxo de governança robusto, é um desafio crítico para a adoção em escala empresarial.
          </p>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-cyan-400">A Solução: Uma Metodologia de 5 Fases</h2>
        <div className="space-y-12">
            <PhaseStep
                number={1}
                title="Base de Conhecimento"
                description="Configure e processe seus documentos, escolhendo as melhores estratégias de divisão (chunking) e vetorização (embedding) para o seu caso de uso."
                icon={<IconDatabase />}
            />
             <PhaseStep
                number={2}
                title="Engenharia de Prompt"
                description="Crie, teste e versione prompts de sistema robustos para guiar o comportamento da IA e garantir respostas seguras e alinhadas ao contexto."
                icon={<IconPencil />}
            />
            <PhaseStep
                number={3}
                title="Avaliação Massiva"
                description="Gere datasets sintéticos e adicione casos de teste manuais para avaliar o sistema em escala, utilizando métricas-chave como Faithfulness e Relevancy."
                icon={<IconChecklist />}
            />
            <PhaseStep
                number={4}
                title="Governança e Aprovação"
                description="Submeta configurações aprovadas para um fluxo de revisão multi-stakeholder (Técnico, Negócio, Risco), garantindo conformidade e controle."
                icon={<IconShield />}
            />
            <PhaseStep
                number={5}
                title="Playground Interativo"
                description="Teste o sistema em tempo real com uma interface de chat. Analise as respostas com ferramentas de diagnóstico, como a rastreabilidade visual de fontes."
                icon={<IconChat />}
                isLast={true}
            />
        </div>
      </section>

      <section className="mb-16">
         <h2 className="text-3xl font-bold text-center mb-12 text-cyan-400">Recursos-Chave</h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Teste A/B de Prompts</h3>
                <p className="text-gray-400 text-sm">Compare duas versões de um prompt lado a lado para ver o impacto direto nas respostas da IA e tomar decisões baseadas em dados.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Versionamento de Prompts</h3>
                <p className="text-gray-400 text-sm">Salve e gerencie diferentes versões de seus prompts. Nunca perca um bom prompt e reverta para versões anteriores com facilidade.</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Rastreabilidade Visual</h3>
                <p className="text-gray-400 text-sm">Passe o mouse sobre a resposta da IA para destacar instantaneamente qual parte do contexto foi usada, tornando a depuração de alucinações simples.</p>
            </div>
             <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-lg font-bold text-cyan-400 mb-2">Auditoria de Governança</h3>
                <p className="text-gray-400 text-sm">Ao submeter para aprovação, a configuração exata (prompt, scores, etc.) é 'congelada', criando um registro de auditoria claro.</p>
            </div>
         </div>
      </section>

      <footer className="text-center mt-16">
        <Button onClick={() => setView('playground')} className="px-8 py-4 text-lg">
          Acessar o Playground
        </Button>
      </footer>
    </div>
  );
};

export default RequirementsPage;