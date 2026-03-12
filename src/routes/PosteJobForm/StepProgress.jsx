import { FaCheck } from 'react-icons/fa';

const STEPS = [
  { number: 1, label: 'Title' },
  { number: 2, label: 'Scope' },
  { number: 3, label: 'Budget' },
  { number: 4, label: 'Location' },
  { number: 5, label: 'Review' },
];

const TAB_LABELS = ['Basic Info', 'Category', 'Details', 'Budget', 'Review'];
const PERCENTS = [20, 40, 60, 80, 100];

export default function StepProgress({ currentStep }) {
  const percent = PERCENTS[currentStep - 1] ?? 20;
  const isStep5 = currentStep === 5;

  return (
    <div className="mb-8 w-full flex justify-center">
      {isStep5 ? (
        /* Step 5: thin bar + tab labels */
        <div className="space-y-2">
          <div className="flex gap-1">
            {STEPS.map((s) => (
              <div
                key={s.number}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  s.number <= currentStep ? 'bg-[#1754cf]' : 'bg-[#1e3054]'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between">
            {TAB_LABELS.map((label, i) => (
              <span
                key={label}
                className={`text-[11px] font-medium ${
                  i + 1 === currentStep ? 'text-[#1754cf]' : i + 1 < currentStep ? 'text-slate-400' : 'text-slate-600'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        /* Steps 1-4: numbered circles - full width, centered */
        <div className="w-full max-w-3xl mx-auto flex items-start">
          {STEPS.map((step, index) => {
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            return (
              <div key={step.number} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isCompleted
                        ? 'bg-[#1754cf] text-white'
                        : isCurrent
                        ? 'bg-[#1754cf] text-white ring-4 ring-[#1754cf]/25'
                        : 'bg-[#1a2638] border border-[#2a3a52] text-slate-500'
                    }`}
                  >
                    {isCompleted ? <FaCheck size={12} /> : step.number}
                  </div>
                  <span
                    className={`text-[11px] mt-1.5 font-medium whitespace-nowrap ${
                      isCurrent ? 'text-[#1754cf]' : isCompleted ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 min-w-[48px] h-px ml-2 mr-2 mt-5 self-center transition-colors ${
                      isCompleted ? 'bg-[#1754cf]' : 'bg-[#1a2638]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
