import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

export default function WorkerJobRequestCard({ 
  request,
  userRole = 'client',
  onAccept,
  onReject,
  onStatusChange
}) {
  if (!request) return null;

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      accepted: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      rejected: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
      expired: 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
    };
    return badges[status] || 'badge-ghost';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleAccept = async () => {
    if (!request._id) return;

    try {
      const response = await axios.patch(
        `${API_BASE}/api/worker-job-requests/${request._id}/status`,
        { status: 'accepted' }
      );
      toast.success('Job request accepted!');
      if (onStatusChange) {
        onStatusChange('accepted', response.data);
      }
      if (onAccept) {
        onAccept(response.data);
      }
    } catch (err) {
      console.error('Failed to accept job request:', err);
      toast.error(err.response?.data?.error || 'Failed to accept job request');
    }
  };

  const handleReject = async () => {
    if (!request._id) return;

    try {
      const response = await axios.patch(
        `${API_BASE}/api/worker-job-requests/${request._id}/status`,
        { status: 'rejected' }
      );
      toast.success('Job request rejected');
      if (onStatusChange) {
        onStatusChange('rejected', response.data);
      }
      if (onReject) {
        onReject(response.data);
      }
    } catch (err) {
      console.error('Failed to reject job request:', err);
      toast.error(err.response?.data?.error || 'Failed to reject job request');
    }
  };

  return (
    <div className="glass border border-white/10 p-5 rounded-2xl space-y-4 shadow-lg backdrop-blur-xl">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-bold text-xl text-white tracking-tight">{request.title}</h3>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(request.status)}`}>
              {request.status || 'pending'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <i className="fas fa-user-tie mr-1"></i>
              Worker Request
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-xs text-white/50 mb-4 font-medium">
            {request.category && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                <i className="fas fa-folder text-blue-400/70"></i>
                {request.category}
              </span>
            )}
            {request.proposedPrice && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                <i className="fas fa-money-bill-wave text-emerald-400/70"></i>
                {request.proposedPrice} {request.currency || 'BDT'}
              </span>
            )}
            {request.location && (
              <span className="flex items-center gap-1.5 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
                <i className="fas fa-map-marker-alt text-rose-400/70"></i>
                {request.location}
              </span>
            )}
            {request.createdAt && (
              <span className="flex items-center gap-1.5">
                <i className="far fa-calendar opacity-50"></i>
                {formatDate(request.createdAt)}
              </span>
            )}
          </div>

          {request.description && (
            <div className="text-[13.5px] text-white/70 bg-white/5 p-4 rounded-xl border border-white/10 leading-relaxed italic border-l-4 border-l-blue-500/50">
              <p className="line-clamp-3">"{request.description}"</p>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons for client */}
      {userRole === 'client' && request.status === 'pending' && (
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleAccept}
            className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 border-none text-white font-bold flex-1 rounded-xl shadow-lg shadow-emerald-600/10 active:scale-95 transition-all"
          >
            Accept Request
          </button>
          <button
            onClick={handleReject}
            className="btn btn-sm bg-rose-600/10 hover:bg-rose-600/20 border border-rose-600/20 text-rose-400 font-bold flex-1 rounded-xl active:scale-95 transition-all"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
