import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import StepTitle from './PosteJobForm/StepTitle';
import StepSkills from './PosteJobForm/StepSkills';
import StepScope from './PosteJobForm/StepScope';
import StepBudgetLocation from './PosteJobForm/StepBudgetLocation';
import StepLocation from './PosteJobForm/StepLocation';
import StepImagesReview from './PosteJobForm/StepImagesReview';
import StepProgress from './PosteJobForm/StepProgress';

const DRAFT_STORAGE_KEY = 'hiremistri_job_draft';

export default function PostJob() {
  const { user } = useContext(AuthContext);
  
  // Load draft from localStorage on mount
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        // Only load if it's for the current user
        if (draft.userId === user?.uid) {
          return draft;
        }
      }
    } catch (err) {
      console.error('Failed to load draft:', err);
    }
    return null;
  };

  const initialDraft = loadDraft();
  
  const [form, setForm] = useState(initialDraft?.form || {
    title: '',
    category: '',
    description: '',
    location: '',
    locationText: '',
    locationGeo: null,
    placeId: null,
    budget: '',
    date: '',
    time: '',
    images: [],
    skills: [],
    duration: '',
    workersNeeded: '',
    urgency: '',
    expiresAt: '',
  });

  const [step, setStep] = useState(initialDraft?.step || 1);

  // Save draft to localStorage whenever form or step changes
  useEffect(() => {
    if (user?.uid) {
      try {
        const draft = {
          userId: user.uid,
          form: {
            ...form,
            // Don't save File objects in localStorage, only metadata
            images: form.images?.map(img => {
              if (img instanceof File) {
                return { type: 'file', name: img.name, size: img.size };
              }
              return img;
            }) || [],
          },
          step,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (err) {
        console.error('Failed to save draft:', err);
      }
    }
  }, [form, step, user?.uid]);

  // Clear draft after successful submission
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // Check if there's a saved draft
  const hasDraft = initialDraft !== null;

  return (
    <div className="min-h-screen page-bg transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Draft Notice */}
        {hasDraft && (
          <div className="alert alert-info mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <div>
              <h3 className="font-bold">Draft Found!</h3>
              <div className="text-xs">You have a saved draft from {initialDraft?.savedAt ? new Date(initialDraft.savedAt).toLocaleString() : 'earlier'}. Your progress has been restored.</div>
            </div>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => {
                if (confirm('Are you sure you want to discard the draft and start fresh?')) {
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                  window.location.reload();
                }
              }}
            >
              Discard Draft
            </button>
          </div>
        )}

        {/* Step Progress Indicator */}
        <StepProgress currentStep={step} />

        {/* Step Content */}
        {step === 1 && (
          <StepTitle form={form} setForm={setForm} nextStep={nextStep} step={step} />
        )}
        {step === 2 && (
          <StepSkills
            form={form}
            setForm={setForm}
            nextStep={() => setStep(3)}
            prevStep={() => setStep(1)}
            step={step}
          />
        )}
        {step === 3 && (
          <StepScope
            form={form}
            setForm={setForm}
            nextStep={() => setStep(4)}
            prevStep={() => setStep(2)}
            step={step}
          />
        )}
        {step === 4 && (
          <StepBudgetLocation
            form={form}
            setForm={setForm}
            nextStep={() => setStep(5)}
            prevStep={() => setStep(3)}
            step={step}
          />
        )}
        {step === 5 && (
          <StepLocation
            form={form}
            setForm={setForm}
            nextStep={() => setStep(6)}
            prevStep={() => setStep(4)}
            step={step}
          />
        )}
        {step === 6 && (
          <StepImagesReview
            form={form}
            setForm={setForm}
            prevStep={() => setStep(5)}
            step={step}
            onSuccess={clearDraft}
          />
        )}
      </div>
    </div>
  );
}