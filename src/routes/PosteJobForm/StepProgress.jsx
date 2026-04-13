import { FaCheck } from 'react-icons/fa';

const STEPS = [
  { number: 1, label: 'Title' },
  { number: 2, label: 'Scope' },
  { number: 3, label: 'Budget' },
  { number: 4, label: 'Location' },
  { number: 5, label: 'Review' },
];

const TAB_LABELS = ['Basic Info', 'Category', 'Details', 'Budget', 'Review'];

export default function StepProgress({ currentStep }) {
  const isStep5 = currentStep === 5;

  return (
    <div className="mb-12 w-full flex justify-center mx-auto">
      {isStep5 ? (
        /* Step 5: High-density review progress */
        <div className="w-full space-y-3">
          <div className="flex gap-2">
            {STEPS.map((s) => (
              <div
                key={s.number}
                className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                  s.number <= currentStep ? 'bg-[#0a58ca]' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between px-1">
            {TAB_LABELS.map((label, i) => (
              <span
                key={label}
                className={`text-xs font-black uppercase tracking-widest transition-colors ${
                  i + 1 === currentStep ? 'text-[#0a58ca]' : i + 1 < currentStep ? 'text-gray-900' : 'text-gray-900'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* Steps 1-4: Clean horizontal numbered steps */
        <div className="w-full flex items-center">
          {STEPS.map((step, index) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            
            return (
              <div key={step.number} className={`flex items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                <div className="flex flex-col items-center group">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 shadow-sm ${
                      isCompleted
                        ? 'bg-[#0a58ca] text-white'
                        : isCurrent
                          ? 'bg-[#0a58ca] text-white shadow-lg shadow-blue-500/20 scale-110'
                          : 'bg-white border border-gray-200 text-gray-400'
                    }`}
                  >
                    {isCompleted ? <FaCheck size={14} /> : step.number}
                  </div>
                  <span
                    className={`text-xs mt-3 font-black uppercase tracking-widest transition-colors ${
                      isCurrent ? 'text-[#0a58ca]' : isCompleted ? 'text-gray-900' : 'text-gray-900'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                
                {index < STEPS.length - 1 && (
                  <div className="flex-1 mx-4 h-0.5 bg-gray-100 relative -mt-6 mt-0">
                    <div 
                      className="absolute inset-0 bg-[#0a58ca] transition-all duration-700 ease-in-out"
                      style={{ width: isCompleted ? '100%' : '0%' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
