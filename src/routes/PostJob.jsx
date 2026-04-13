import { useState, useEffect } from 'react';
import { useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import PageContainer from '../components/layout/PageContainer';
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
    <div className="bg-[#f8f9fa] min-h-screen">
      <PageContainer>
        <div className="py-8 lg:py-12">
          {/* Draft Notice */}
          {hasDraft && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 mb-8 text-sm shadow-sm transition-all animate-in fade-in slide-in-from-top-4">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#0a58ca] shadow-sm">
                <i className="fas fa-info-circle" />
              </div>
              <div className="flex-1 text-gray-700 font-medium">
                <span className="font-bold text-[#0a58ca]">Draft restored</span> — saved on{' '}
                {initialDraft?.savedAt ? new Date(initialDraft.savedAt).toLocaleString() : 'earlier'}.
              </div>
              <button
                className="text-gray-400 hover:text-red-500 text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-gray-100 transition-all shadow-sm"
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
      </PageContainer>
    </div>
  );
}