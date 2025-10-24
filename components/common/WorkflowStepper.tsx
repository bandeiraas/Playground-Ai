import React from 'react';

type StepStatus = 'completed' | 'active' | 'pending';

interface Step {
  name: string;
  description: string;
  icon: string;
  status: StepStatus;
}

interface WorkflowStepperProps {
  steps: Step[];
  onStepClick?: (stepIndex: number) => void;
}

const getStatusClasses = (status: StepStatus) => {
  switch (status) {
    case 'completed':
      return {
        iconBg: 'bg-green-500',
        textColor: 'text-green-300',
        lineBg: 'bg-green-500',
        container: 'cursor-pointer hover:bg-gray-700/50',
      };
    case 'active':
      return {
        iconBg: 'bg-cyan-500 animate-pulse',
        textColor: 'text-cyan-300 font-bold',
        lineBg: 'bg-gray-700',
        container: 'cursor-default',
      };
    case 'pending':
    default:
      return {
        iconBg: 'bg-gray-700',
        textColor: 'text-gray-500',
        lineBg: 'bg-gray-700',
        container: 'cursor-default',
      };
  }
};

const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ steps, onStepClick }) => {
  return (
    <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700 mb-4">
      <div className="flex items-start justify-between">
        {steps.map((step, index) => {
          const { iconBg, textColor, lineBg, container } = getStatusClasses(step.status);
          const isLast = index === steps.length - 1;
          const isClickable = step.status === 'completed' && onStepClick;

          return (
            <React.Fragment key={step.name}>
              <button
                onClick={() => isClickable && onStepClick(index)}
                disabled={!isClickable}
                className={`flex flex-col items-center text-center flex-1 min-w-0 px-2 rounded-md transition-colors duration-200 ${container}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl transition-colors duration-300 flex-shrink-0 ${iconBg}`}>
                  <i className={`fas ${step.icon}`}></i>
                </div>
                <div className="mt-2">
                    <p className={`text-sm font-medium transition-colors duration-300 ${textColor}`}>
                        {step.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 h-8">{step.description}</p>
                </div>
              </button>
              {!isLast && (
                <div className={`flex-1 h-1 mt-6 mx-2 rounded-full transition-colors duration-300 ${lineBg}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WorkflowStepper;