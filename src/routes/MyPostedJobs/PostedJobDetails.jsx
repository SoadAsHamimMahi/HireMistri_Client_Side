import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function PostedJobDetails() {
  const { id } = useParams();
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  // Applications (for this job)
  const [apps, setApps] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsErr, setAppsErr] = useState('');

  // Modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const res = await fetch(`${base}/api/browse-jobs/${id}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
          const text = await res.text();
          throw new Error(`Expected JSON, got '${ct}'. First bytes: ${text.slice(0, 80)}`);
        }
        const data = await res.json();
        if (!ignore) setJob(data);
      } catch (e) {
        if (!ignore) setErr(e.message || 'Failed to load job');
        console.error(e);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id, base]);

  // load applications for this job
  useEffect(() => {
    if (!id) return;
    let ignore = false;
    (async () => {
      try {
        setAppsLoading(true);
        setAppsErr('');
        const res = await fetch(`${base}/api/job-applications/${id}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!ignore) setApps(data || []);
      } catch (e) {
        if (!ignore) setAppsErr(e.message || 'Failed to load applications');
      } finally {
        if (!ignore) setAppsLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id, base]);

  const images = Array.isArray(job?.images) && job.images.length > 0
    ? job.images
    : ['https://via.placeholder.com/1200x800?text=No+Image'];

  // ---------- helpers ----------
  const timeAgo = (iso) => {
    if (!iso) return '—';
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d} day${d > 1 ? 's' : ''} ago`;
    if (h > 0) return `${h} hour${h > 1 ? 's' : ''} ago`;
    if (m > 0) return `${m} minute${m > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3">
      <span className="text-xl leading-6">{icon}</span>
      <div className="text-sm">
        <p className="text-gray-500">{label}</p>
        <p className="font-medium text-gray-800">{value}</p>
      </div>
    </div>
  );

  const Badge = ({ text, tone = 'default' }) => {
    const tones = {
      default: 'bg-gray-100 text-gray-700',
      active: 'bg-green-100 text-green-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      completed: 'bg-blue-100 text-blue-700',
      pending: 'bg-gray-100 text-gray-700',
      accepted: 'bg-green-100 text-green-700',
      rejected: 'bg-rose-100 text-rose-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tones[tone] || tones.default}`}>
        {text}
      </span>
    );
  };

  // Accept / Reject
 // Accept / Reject
const decide = async (app, nextStatus) => {
  if (!app || !app._id) {
    alert('Missing application id'); 
    return;
  }
  try {
    setDeciding(true);

    // ✅ use the status endpoint
    const res = await fetch(`${base}/api/applications/${app._id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({}));
      throw new Error(error || `Failed to update status (${res.status})`);
    }

    // update local UI
    setApps(prev =>
      prev.map(x => x._id === app._id ? { ...x, status: nextStatus } : x)
    );
    setSelected(s => s && { ...s, status: nextStatus });
  } catch (e) {
    alert(e.message || 'Failed to update application');
  } finally {
    setDeciding(false);
  }
};


  const openModal = (app) => {
    setSelected(app);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setSelected(null);
  };

  if (loading) return <div className="py-16 text-center">Loading…</div>;
  if (err) return <div className="py-16 text-center text-red-600">❌ {err}</div>;
  if (!job) return <div className="py-16 text-center">Not found.</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-5">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-primary">
          {job.title}
        </h1>
        <Link to="/My-Posted-Jobs" className="btn btn-outline btn-sm">Back</Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: slider */}
        <div className="self-start bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            className="w-full h-full"
          >
            {images.map((img, i) => (
              <SwiperSlide key={i} className="!p-0">
                <img
                  src={img}
                  alt={`Job image ${i + 1}`}
                  className="w-full h-[450px] object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Right: details + applicants */}
        <div className="bg-white border rounded-xl p-5 md:p-6 shadow-sm flex flex-col gap-5">
          {/* top row */}
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge text={job.status || 'active'} tone={(job.status || 'active').toLowerCase()} />
              {Array.isArray(job.skills) && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <InfoRow icon="⏱️" label="Posted" value={timeAgo(job.createdAt)} />
            </div>
          </div>

          {/* info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon="🧰" label="Category" value={job.category || '—'} />
            <InfoRow icon="📍" label="Location" value={job.location || '—'} />
            <InfoRow icon="💸" label="Budget" value={`${job.budget || 0} ৳`} />
            <InfoRow icon="📅" label="Schedule" value={`${job.date || '—'}${job.time ? ` • ${job.time}` : ''}`} />
          </div>

          {/* description */}
          <div>
            <p className="text-gray-500 text-sm mb-1">Description</p>
            <p className="leading-relaxed text-gray-800 bg-base-100 p-4 rounded-lg">
              {job.description || 'No description provided.'}
            </p>
          </div>

          {/* actions */}
          <div className="pt-2 flex gap-3">
            <Link to="/My-Posted-Jobs" className="btn btn-outline">Back to list</Link>
            <button className="btn">Edit</button>
            <button className="btn btn-error text-white">Delete</button>
          </div>

          {/* Applicants */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Applicants</h2>
              <Badge text={`${apps?.length || 0} total`} />
            </div>

            {appsLoading ? (
              <div className="p-4 border rounded-lg text-sm text-gray-600 bg-base-100">Loading applications…</div>
            ) : appsErr ? (
              <div className="p-4 border rounded-lg text-sm text-rose-600 bg-rose-50">❌ {appsErr}</div>
            ) : Array.isArray(apps) && apps.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Worker</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((a, i) => (
                      <tr key={`${a.workerId}-${i}`}>
                        <td>{i + 1}</td>
                        <td>{a.workerName || '—'}</td>
                        <td className="break-all">{a.workerEmail || a.postedByEmail || '—'}</td>
                        <td>{a.workerPhone || '—'}</td>
                        <td><Badge text={a.status || 'pending'} tone={(a.status || 'pending').toLowerCase()} /></td>
                        <td className="text-right">
                          <button className="btn btn-sm btn-outline" onClick={() => openModal(a)}>View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-4 border rounded-lg text-sm text-gray-600 bg-base-100">
                No applicants yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white w-full max-w-lg rounded-xl shadow-lg p-5">
            <h3 className="text-lg font-semibold mb-3">Application</h3>

            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 w-28">Name</span>
                <span className="font-medium">{selected.workerName || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 w-28">Email</span>
                <span className="font-medium break-all">{selected.workerEmail || selected.postedByEmail || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 w-28">Phone</span>
                <span className="font-medium">{selected.workerPhone || '—'}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500 w-28">Status</span>
                <span><Badge text={selected.status || 'pending'} tone={(selected.status || 'pending').toLowerCase()} /></span>
              </div>
            </div>

            <div>
              <p className="text-gray-500 text-sm mb-1">Proposal</p>
              <div className="p-3 border rounded-lg bg-base-100 whitespace-pre-wrap">
                {selected.proposalText || '—'}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <button className="btn" onClick={closeModal}>Close</button>
              <div className="flex gap-2">
                <button
                  className="btn btn-success"
                  disabled={deciding}
                  onClick={() => decide(selected, 'accepted')}
                >
                  {deciding && selected.status !== 'accepted' ? 'Saving…' : 'Accept'}
                </button>
                <button
                  className="btn btn-error text-white"
                  disabled={deciding}
                  onClick={() => decide(selected, 'rejected')}
                >
                  {deciding && selected.status !== 'rejected' ? 'Saving…' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
