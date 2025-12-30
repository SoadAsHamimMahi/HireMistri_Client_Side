import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../Authentication/AuthProvider';
import StepTitle from './PosteJobForm/StepTitle';
import StepSkills from './PosteJobForm/StepSkills';
import StepScope from './PosteJobForm/StepScope';
import StepBudgetLocation from './PosteJobForm/StepBudgetLocation';
import StepImagesReview from './PosteJobForm/StepImagesReview';
import StepProgress from './PosteJobForm/StepProgress';
import axios from 'axios';

export default function EditJob() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

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
    duration: '',
    workersNeeded: '',
    urgency: '',
    expiresAt: '',
  });

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load existing job data
  useEffect(() => {
    const fetchJob = async () => {
      if (!id) {
        setError('Job ID is missing');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        console.log('🔍 Fetching job with ID:', id);
        const response = await axios.get(`${base}/api/browse-jobs/${id}`);
        const job = response.data;
        
        if (!job) {
          throw new Error('Job not found');
        }

        // Convert image URLs to File objects for editing (or keep as URLs)
        // For now, we'll keep them as URLs and handle them in StepImagesReview
        // Format expiresAt if it exists
        let expiresAtFormatted = '';
        if (job.expiresAt) {
          const expDate = new Date(job.expiresAt);
          expiresAtFormatted = expDate.toISOString().split('T')[0];
        }

        setForm({
          title: job.title || '',
          category: job.category || '',
          description: job.description || '',
          location: job.location || '',
          budget: job.budget || '',
          date: job.date || '',
          time: job.time || '',
          images: job.images || [], // Keep as URLs for now
          skills: job.skills || [],
          duration: job.duration || '',
          workersNeeded: job.workersNeeded || '',
          urgency: job.urgency || '',
          expiresAt: expiresAtFormatted,
        });
      } catch (err) {
        console.error('Failed to load job:', err);
        setError(err.response?.data?.error || 'Failed to load job');
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchJob();
    }
  }, [id, user, base]);

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 5));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  // Custom submit handler for editing
  const handleSubmit = async (updatedForm) => {
    if (!user) {
      alert("You must be logged in to edit a job!");
      return;
    }

    try {
      // Handle image uploads if there are new files
      let imageUrls = updatedForm.images || [];
      
      // Check if images are File objects (new uploads) or URLs (existing)
      const newImageFiles = imageUrls.filter(img => img instanceof File);
      const existingImageUrls = imageUrls.filter(img => typeof img === 'string');

      if (newImageFiles.length > 0) {
        const formData = new FormData();
        newImageFiles.forEach((file) => {
          formData.append("images", file);
        });

        const uploadRes = await axios.post(
          `${base}/api/browse-jobs/upload`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        // Combine existing URLs with new ones
        imageUrls = [...existingImageUrls, ...uploadRes.data.imageUrls];
      }

      // Update job data
      const updateData = {
        title: updatedForm.title,
        category: updatedForm.category,
        skills: updatedForm.skills || [],
        description: updatedForm.description,
        location: updatedForm.location,
        budget: updatedForm.budget,
        date: updatedForm.date,
        time: updatedForm.time,
        duration: updatedForm.duration,
        workersNeeded: updatedForm.workersNeeded,
        urgency: updatedForm.urgency,
        images: imageUrls,
        expiresAt: updatedForm.expiresAt || null,
      };

      await axios.patch(`${base}/api/browse-jobs/${id}`, updateData);

      // Navigate back to job details or list
      navigate(`/My-Posted-Job-Details/${id}`);
    } catch (err) {
      console.error("Failed to update job:", err);
      alert(err.response?.data?.error || "Failed to update job. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content opacity-70">Loading job data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-base-100 transition-colors duration-300 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h2 className="text-2xl font-bold mb-2 text-base-content">Error</h2>
          <p className="text-lg opacity-70 mb-4">{error}</p>
          <button onClick={() => navigate('/My-Posted-Jobs')} className="btn btn-primary">
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-base-content">Edit Job</h1>
          <p className="text-base-content opacity-70 mt-2">
            Update your job posting details
          </p>
        </div>

        {/* Step Progress Indicator */}
        <StepProgress currentStep={step} />

        {/* Step Content */}
        {step === 1 && (
          <StepTitle 
            form={form} 
            setForm={setForm} 
            nextStep={nextStep} 
            step={step} 
          />
        )}
        {step === 2 && (
          <StepSkills
            form={form}
            setForm={setForm}
            nextStep={nextStep}
            prevStep={prevStep}
            step={step}
          />
        )}
        {step === 3 && (
          <StepScope
            form={form}
            setForm={setForm}
            nextStep={nextStep}
            prevStep={prevStep}
            step={step}
          />
        )}
        {step === 4 && (
          <StepBudgetLocation
            form={form}
            setForm={setForm}
            nextStep={nextStep}
            prevStep={prevStep}
            step={step}
          />
        )}
        {step === 5 && (
          <StepImagesReview
            form={form}
            setForm={setForm}
            prevStep={prevStep}
            step={step}
            isEditMode={true}
            onSubmit={handleSubmit}
            jobId={id}
          />
        )}
      </div>
    </div>
  );
}

