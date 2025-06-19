import { useState } from 'react';
import StepTitle from './PosteJobForm/StepTitle';
import StepSkills from './PosteJobForm/StepSkills';
import StepScope from './PosteJobForm/StepScope';
import StepBudgetLocation from './PosteJobForm/StepBudgetLocation';
import StepImagesReview from './PosteJobForm/StepImagesReview';


export default function PostJob() {
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
    <div className="max-w-6xl mx-auto px-6 py-10">
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
    handleSubmit={() => {
      console.log('Final Submitted Data:', form);
      alert('✅ Job successfully posted!');
      // Later: connect API here
    }}
  />
)}


    </div>
  );
}
