import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import StepTitle from './PosteJobForm/StepTitle';
import StepSkills from './PosteJobForm/StepSkills';
import StepScope from './PosteJobForm/StepScope';
import StepBudgetLocation from './PosteJobForm/StepBudgetLocation';
import StepImagesReview from './PosteJobForm/StepImagesReview';


export default function PostJob() {
  const { isDarkMode } = useTheme();
  const [form, setForm] = useState({
    title: '',
    category: '',
    description: '',
    location: '',
    budget: '',
    date: '',
    time: '',
    images: [],
    skills: [],
  });

  const [step, setStep] = useState(1);

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  return (
    <div className={`max-w-6xl mx-auto px-6 py-10 transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {step === 1 && (
        <StepTitle form={form} setForm={setForm} nextStep={nextStep} />
      )}
     {step === 2 && (
            <StepSkills
              form={form}
              setForm={setForm}
              nextStep={() => setStep(3)}
              prevStep={() => setStep(1)}
            />
          )}
          {step === 3 && (
  <StepScope
    form={form}
    setForm={setForm}
    nextStep={() => setStep(4)}
    prevStep={() => setStep(2)}
  />
)}
{step === 4 && (
  <StepBudgetLocation
    form={form}
    setForm={setForm}
    nextStep={() => setStep(5)}
    prevStep={() => setStep(3)}
  />
)}

{step === 5 && (
  <StepImagesReview
    form={form}
    setForm={setForm}
    prevStep={() => setStep(4)}
  />
)}


    </div>
  );
}