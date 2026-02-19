import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function ChatApplicationStatus({ 
  jobId, 
  workerId, 
  userRole = 'client',
  onStatusChange 
}) {
  const [applicationData, setApplicationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [showCounterOffer, setShowCounterOffer] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      if (!jobId || !workerId) {
        setApplicationData(null);
        setStatus(null);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE}/api/applications/${jobId}/${workerId}`
        );
        setApplicationData(response.data);
        setStatus(response.data.status || 'pending');
      } catch (err) {
        if (err.response?.status === 404) {
          // No application yet
          setApplicationData(null);
          setStatus(null);
        } else {
          console.error('Failed to fetch application status:', err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApplicationStatus();

    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchApplicationStatus, 5000);
    return () => clearInterval(interval);
  }, [jobId, workerId]);

  const handleAccept = async () => {
    if (!applicationData?._id) return;

    try {
      setLoading(true);
      const response = await axios.patch(
        `${API_BASE}/api/applications/${applicationData._id}/status`,
        { status: 'accepted' }
      );
      setApplicationData(response.data);
      setStatus('accepted');
      toast.success('Application accepted!');
      if (onStatusChange) onStatusChange('accepted', response.data);
    } catch (err) {
      console.error('Failed to accept application:', err);
      toast.error(err.response?.data?.error || 'Failed to accept application');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!applicationData?._id) return;

    try {
      setLoading(true);
      const response = await axios.patch(
        `${API_BASE}/api/applications/${applicationData._id}/status`,
        { status: 'rejected' }
      );
      setApplicationData(response.data);
      setStatus('rejected');
      toast.success('Application rejected');
      if (onStatusChange) onStatusChange('rejected', response.data);
    } catch (err) {
      console.error('Failed to reject application:', err);
      toast.error(err.response?.data?.error || 'Failed to reject application');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptPrice = async () => {
    if (!applicationData?._id || !applicationData?.proposedPrice) return;

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/api/applications`, {
        jobId,
        workerId,
        finalPrice: applicationData.proposedPrice,
        negotiationStatus: 'accepted'
      });
      setApplicationData(response.data.application);
      toast.success('Price accepted!');
      if (onStatusChange) onStatusChange(status, response.data.application);
    } catch (err) {
      console.error('Failed to accept price:', err);
      toast.error(err.response?.data?.error || 'Failed to accept price');
    } finally {
      setLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!applicationData?._id || !counterPrice || parseFloat(counterPrice) <= 0) {
      toast.error('Please enter a valid counter price');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/api/applications`, {
        jobId,
        workerId,
        counterPrice: parseFloat(counterPrice),
        negotiationStatus: 'countered'
      });
      setApplicationData(response.data.application);
      setShowCounterOffer(false);
      setCounterPrice('');
      toast.success('Counter offer sent!');
      if (onStatusChange) onStatusChange(status, response.data.application);
    } catch (err) {
      console.error('Failed to send counter offer:', err);
      toast.error(err.response?.data?.error || 'Failed to send counter offer');
    } finally {
      setLoading(false);
    }
  };

  if (!jobId || !workerId) return null;

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      accepted: 'badge-success',
      rejected: 'badge-error',
      completed: 'badge-info'
    };
    return badges[status] || 'badge-ghost';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'Pending',
      accepted: 'Accepted',
      rejected: 'Rejected',
      completed: 'Completed'
    };
    return texts[status] || status;
  };

  if (loading && !applicationData) {
    return (
      <div className="flex items-center justify-center p-4">
        <span className="loading loading-spinner loading-sm"></span>
      </div>
    );
  }

  // No application yet
  if (!applicationData && status === null) {
    return (
      <div className="bg-base-200 p-4 rounded-lg border border-base-300">
        <p className="text-sm text-base-content/70">
          Waiting for worker to apply...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-base-200 p-4 rounded-lg border border-base-300 space-y-3">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`badge ${getStatusBadge(status)}`}>
            {getStatusText(status)}
          </span>
          {applicationData?.proposedPrice && (
            <span className="text-sm font-semibold text-base-content">
              {applicationData.proposedPrice} {applicationData.currency || 'BDT'}
            </span>
          )}
        </div>
        {applicationData?._id && (
          <Link
            to={`/applications/${applicationData._id}`}
            className="text-xs link link-primary"
          >
            View Details
          </Link>
        )}
      </div>

      {/* Proposal Text Preview - support both proposalText (normal apply) and proposal (job-offer accept) */}
      {(applicationData?.proposalText || applicationData?.proposal) && (
        <div className="text-sm text-base-content/80 bg-base-100 p-3 rounded border border-base-300">
          <p className="line-clamp-2">{applicationData.proposalText || applicationData.proposal}</p>
        </div>
      )}

      {/* Action Buttons for Client */}
      {userRole === 'client' && status === 'pending' && (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="btn btn-sm btn-success flex-1"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              'Accept'
            )}
          </button>
          <button
            onClick={handleReject}
            disabled={loading}
            className="btn btn-sm btn-error flex-1"
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              'Reject'
            )}
          </button>
        </div>
      )}

      {/* Price Negotiation - show when proposed price exists and no final price yet (pending or job-offer accepted with proposed budget) */}
      {userRole === 'client' && 
       applicationData?.proposedPrice && 
       !applicationData?.finalPrice && 
       (status === 'pending' || status === 'accepted') && (
        <div className="pt-2 border-t border-base-300 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-base-content/60">
                {status === 'accepted' ? "Worker's proposed price:" : 'Proposed Price:'}{' '}
                <span className="font-semibold text-base-content">
                  {applicationData.proposedPrice} {applicationData.currency || 'BDT'}
                </span>
              </p>
              {applicationData?.counterPrice && (
                <p className="text-xs text-base-content/60 mt-1">
                  Your Counter: <span className="font-semibold text-base-content">
                    {applicationData.counterPrice} {applicationData.currency || 'BDT'}
                  </span>
                </p>
              )}
              {applicationData?.finalPrice && (
                <p className="text-xs text-success mt-1">
                  Agreed Price: <span className="font-semibold">
                    {applicationData.finalPrice} {applicationData.currency || 'BDT'}
                  </span>
                </p>
              )}
            </div>
          </div>
          
          {!applicationData?.finalPrice && (
            <div className="flex gap-2">
              {!showCounterOffer ? (
                <>
                  <button
                    onClick={handleAcceptPrice}
                    disabled={loading}
                    className="btn btn-sm btn-success flex-1"
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Accept Price'
                    )}
                  </button>
                  <button
                    onClick={() => setShowCounterOffer(true)}
                    disabled={loading}
                    className="btn btn-sm btn-outline flex-1"
                  >
                    Counter Offer
                  </button>
                </>
              ) : (
                <div className="flex gap-2 w-full">
                  <input
                    type="number"
                    className="input input-bordered input-sm flex-1"
                    placeholder="Enter counter price"
                    value={counterPrice}
                    onChange={(e) => setCounterPrice(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <button
                    onClick={handleCounterOffer}
                    disabled={loading || !counterPrice}
                    className="btn btn-sm btn-primary"
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Send'
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowCounterOffer(false);
                      setCounterPrice('');
                    }}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
