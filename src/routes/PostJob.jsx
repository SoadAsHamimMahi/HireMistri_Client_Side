import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import StepTitle from './PosteJobForm/StepTitle';
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
    floorHouseNo: '',
    landmark: '',
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
    <div className="min-h-screen">
      <div className="w-full py-8 lg:py-12">
        {/* Draft Notice */}
        {hasDraft && (
          <div className="flex items-center gap-3 bg-[#111e34] border border-[#1754cf]/30 rounded-xl px-4 py-3 mb-6 text-sm">
            <i className="fas fa-circle-info text-[#1754cf]" />
            <div className="flex-1 text-slate-300">
              <span className="font-semibold text-white">Draft restored</span> — from{' '}
              {initialDraft?.savedAt ? new Date(initialDraft.savedAt).toLocaleString() : 'earlier'}.
            </div>
            <button
              className="text-slate-400 hover:text-white text-xs underline underline-offset-2 shrink-0 transition-colors"
              onClick={() => {
                if (confirm('Are you sure you want to discard the draft and start fresh?')) {
                  localStorage.removeItem(DRAFT_STORAGE_KEY);
                  window.location.reload();
                }
              }}
            >
              Discard
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
          <StepScope
            form={form}
            setForm={setForm}
            nextStep={() => setStep(3)}
            prevStep={() => setStep(1)}
            step={step}
          />
        )}
        {step === 3 && (
          <StepBudgetLocation
            form={form}
            setForm={setForm}
            nextStep={() => setStep(4)}
            prevStep={() => setStep(2)}
            step={step}
          />
        )}
        {step === 4 && (
          <StepLocation
            form={form}
            setForm={setForm}
            nextStep={() => setStep(5)}
            prevStep={() => setStep(3)}
            step={step}
          />
        )}
        {step === 5 && (
          <StepImagesReview
            form={form}
            setForm={setForm}
            prevStep={() => setStep(4)}
            goToStep={setStep}
            step={step}
            onSuccess={clearDraft}
          />
        )}
      </div>
    </div>
  );
}