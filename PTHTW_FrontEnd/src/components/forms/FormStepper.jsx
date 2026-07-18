export default function FormStepper({ steps, currentStep, completedSteps, onStepClick }) {
  return (
    <nav className="flex items-center justify-center mb-8">
      {steps.map((step, i) => {
        const isCompleted = completedSteps.has(i);
        const isCurrent = i === currentStep;
        const isClickable = isCompleted && !isCurrent;

        return (
          <div key={i} className="flex items-center">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                ${isCurrent ? 'bg-blue-600 text-white shadow-sm' : ''}
                ${isCompleted && !isCurrent ? 'bg-green-100 text-green-700 hover:bg-green-200 cursor-pointer' : ''}
                ${!isCompleted && !isCurrent ? 'bg-gray-100 text-gray-400 cursor-default' : ''}`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                ${isCurrent ? 'bg-white text-blue-600' : ''}
                ${isCompleted && !isCurrent ? 'bg-green-500 text-white' : ''}
                ${!isCompleted && !isCurrent ? 'bg-gray-300 text-white' : ''}`}>
                {isCompleted && !isCurrent ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{step}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${isCompleted ? 'bg-green-300' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
