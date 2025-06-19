import { useState } from 'react';
import StepSkills from './StepSkills';
import StepTitle from './StepTitle'; 


export default function PostJobWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    title: '',
    skills: [],
    // upcoming fields: category, description, etc.
  });

  return (
    <>
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
      {/* future steps here */}
    </>
  );
}
