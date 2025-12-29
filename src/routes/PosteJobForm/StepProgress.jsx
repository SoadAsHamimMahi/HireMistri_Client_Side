import { FaCheck } from 'react-icons/fa';

export default function StepProgress({ currentStep }) {
  const steps = [
    { number: 1, label: 'Title' },
    { number: 2, label: 'Skills' },
    { number: 3, label: 'Scope' },
    { number: 4, label: 'Budget' },
    { number: 5, label: 'Review' },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isUpcoming = step.number > currentStep;

          return (
            <div key={step.number} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                    isCompleted
                      ? 'bg-primary text-primary-content'
                      : isCurrent
                      ? 'bg-primary text-primary-content ring-4 ring-primary/20'
                      : 'bg-base-300 text-base-content opacity-50'
                  }`}
                >
                  {isCompleted ? (
                    <FaCheck className="text-sm" />
                  ) : (
                    step.number
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium transition-colors ${
                    isCurrent
                      ? 'text-primary'
                      : isCompleted
                      ? 'text-base-content opacity-70'
                      : 'text-base-content opacity-50'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    isCompleted ? 'bg-primary' : 'bg-base-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-base-300 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          />
        </div>
        <p className="text-xs text-base-content opacity-60 mt-2 text-center">
          Step {currentStep} of {steps.length}
        </p>
      </div>
    </div>
  );
}

