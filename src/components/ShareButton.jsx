import React, { useRef } from 'react';
import toast from 'react-hot-toast';

export default function ShareButton({ jobId, jobTitle, jobDescription, isClient = false }) {
  const isCopyingRef = useRef(false);
  
  // Generate shareable URL
  const shareUrl = isClient
    ? `${window.location.origin}/My-Posted-Job-Details/${jobId}`
    : `${window.location.origin}/jobs/${jobId}`;

  const handleCopyLink = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent double clicks
    if (isCopyingRef.current) return;
    isCopyingRef.current = true;

    navigator.clipboard.writeText(shareUrl).then(() => {
      toast.success('Link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    }).finally(() => {
      // Reset after a short delay
      setTimeout(() => {
        isCopyingRef.current = false;
      }, 500);
    });
  };

  return (
    <button
      onClick={handleCopyLink}
      className="btn btn-sm btn-outline"
      title="Copy job link"
    >
      <i className="fas fa-link mr-2"></i>
      Copy Link
    </button>
  );
}
