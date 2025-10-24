import React, { useState } from 'react';

// The View type needs to be consistent with App.tsx
type View = 'requirements' | 'playground' | 'kb' | 'analyzer' | 'test-generator' | 'dashboard' | 'chunk-explorer';

type StepStatus = 'completed' | 'active' | 'pending';

interface Step {
  name: string;
  icon: string;
  status: StepStatus;
  description?: string;
}

interface NavbarProps {
  currentView: View;
  setView: (view: View) => void;
  onImport: () => void;
  onExport: () => void;
  workflowStatus: Step[];
}

const NavLink: React.FC<{
  label: string;
  icon: string;
  isActive: boolean;
  isDisabled?: boolean;
  isCompleted?: boolean;
  onClick?: () => void;
  isMobile?: boolean;
}> = ({ label, icon, isActive, isDisabled = false, isCompleted = false, onClick, isMobile = false }) => {
  const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
  const activeClasses = "bg-gray-700 text-white";
  const inactiveClasses = "text-gray-300 hover:bg-gray-700/50 hover:text-white";
  const disabledClasses = "text-gray-500 cursor-not-allowed";
  
  const mobileClasses = isMobile ? "w-full justify-start text-base" : "";

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${mobileClasses} ${
        isDisabled ? disabledClasses : (isActive ? activeClasses : inactiveClasses)
      }`}
    >
      <i className={`${icon} w-5 text-center`}></i>
      <span>{label}</span>
      {isCompleted && !isActive && <i className="fas fa-check-circle text-green-400 ml-auto"></i>}
    </button>
  );
};

const ActionButton: React.FC<{
    label: string;
    icon: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    isMobile?: boolean;
}> = ({ label, icon, onClick, variant = 'secondary', isMobile = false }) => {
    const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200";
    const variantClasses = {
        primary: "bg-cyan-600 text-white hover:bg-cyan-700",
        secondary: "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white"
    };
    const mobileClasses = isMobile ? "w-full justify-start text-base" : "";

    return (
        <button onClick={onClick} className={`${baseClasses} ${mobileClasses} ${variantClasses[variant]}`}>
            <i className={`${icon} w-5 text-center`}></i>
            <span>{label}</span>
        </button>
    );
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, onImport, onExport, workflowStatus }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isKbCompleted = workflowStatus[1]?.status === 'completed'; 
  const isAnalyzerCompleted = workflowStatus[1]?.status === 'completed';
  const isTestGenCompleted = workflowStatus[2]?.status === 'completed';
  
  const navLinks = [
    { label: "Apresentação", icon: "fas fa-sitemap", view: "requirements" as View, isCompleted: false },
    { label: "Playground", icon: "fas fa-desktop", view: "playground" as View, isCompleted: false },
    { label: "Dashboard", icon: "fas fa-tachometer-alt", view: "dashboard" as View, isCompleted: false },
    { label: "Base de Conhecimento", icon: "fas fa-database", view: "kb" as View, isCompleted: isKbCompleted },
    { label: "Analisador de Prompts", icon: "fas fa-wand-magic-sparkles", view: "analyzer" as View, isCompleted: isAnalyzerCompleted },
    { label: "Gerador de Testes", icon: "fas fa-flask-vial", view: "test-generator" as View, isCompleted: isTestGenCompleted },
  ];
  
  const handleLinkClick = (view: View) => {
    setView(view);
    setIsMobileMenuOpen(false); // Close menu on navigation
  }

  return (
    <nav className="bg-gray-800/80 backdrop-blur-sm shadow-lg fixed top-0 left-0 right-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Desktop Links */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center gap-2">
               <i className="fas fa-flask text-cyan-400 text-2xl"></i>
               <h1 className="text-xl font-bold text-cyan-400">Atlas AI Playground</h1>
            </div>
            {/* Desktop Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-2">
                {navLinks.map(link => (
                    <NavLink 
                        key={link.label}
                        label={link.label}
                        icon={link.icon}
                        isActive={currentView === link.view}
                        onClick={() => handleLinkClick(link.view)}
                        isCompleted={link.isCompleted}
                    />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Action Buttons */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6 space-x-2">
               <ActionButton
                  label="Importar Sessão"
                  icon="fas fa-upload"
                  onClick={onImport}
               />
               <ActionButton
                  label="Exportar Sessão"
                  icon="fas fa-download"
                  onClick={onExport}
                  variant="primary"
               />
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="bg-gray-700 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <i className="fas fa-times block h-6 w-6"></i>
              ) : (
                <i className="fas fa-bars block h-6 w-6"></i>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map(link => (
                <NavLink 
                    key={link.label}
                    label={link.label}
                    icon={link.icon}
                    isActive={currentView === link.view}
                    onClick={() => handleLinkClick(link.view)}
                    isCompleted={link.isCompleted}
                    isMobile={true}
                />
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-700">
            <div className="px-2 space-y-2">
               <ActionButton
                  label="Importar Sessão"
                  icon="fas fa-upload"
                  onClick={onImport}
                  isMobile={true}
               />
               <ActionButton
                  label="Exportar Sessão"
                  icon="fas fa-download"
                  onClick={onExport}
                  variant="primary"
                  isMobile={true}
               />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
