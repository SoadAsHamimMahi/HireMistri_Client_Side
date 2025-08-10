import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function PostedJobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

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

  if (loading) return <div className="py-16 text-center">Loading…</div>;
  if (err) return <div className="py-16 text-center text-red-600">❌ {err}</div>;
  if (!job) return <div className="py-16 text-center">Not found.</div>;

  const images = Array.isArray(job.images) && job.images.length > 0
    ? job.images
    : ['https://via.placeholder.com/800x500?text=No+Image'];

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
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${tones[tone] || tones.default}`}>
        {text}
      </span>
    );
  };

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
        {/* Left: Image slider */}
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            className="w-full h-full"
          >
            {images.map((img, i) => (
              <SwiperSlide key={i}>
                <div className="aspect-[16/10] bg-base-200">
                  <img
                    src={img}
                    alt={`Job image ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Right: Details */}
        <div className="bg-white border rounded-xl p-5 md:p-6 shadow-sm flex flex-col gap-5">
          {/* Status + meta */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge text={job.status || 'active'} tone={(job.status || 'active').toLowerCase()} />
            {Array.isArray(job.skills) && job.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s, i) => (
                  <span key={i} className="px-2.5 py-0.5 text-xs bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Info rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow icon="🧰" label="Category" value={job.category || '—'} />
            <InfoRow icon="📍" label="Location" value={job.location || '—'} />
            <InfoRow icon="💸" label="Budget" value={`${job.budget || 0} ৳`} />
            <InfoRow icon="📅" label="Schedule" value={`${job.date || '—'}${job.time ? ` • ${job.time}` : ''}`} />
          </div>

          {/* Description */}
          <div>
            <p className="text-gray-500 text-sm mb-1">Description</p>
            <p className="leading-relaxed text-gray-800 bg-base-100 p-4 rounded-lg">
              {job.description || 'No description provided.'}
            </p>
          </div>

          <div className="pt-2 flex gap-3">
            <Link to="/My-Posted-Jobs" className="btn btn-outline">Back to list</Link>
            {/* You can wire these later: */}
            <button className="btn">Edit</button>
            <button className="btn btn-error text-white">Delete</button>
          </div>

          {/* Applicants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Applicants</h2>
              <Badge text={`${job.applicants?.length || 0} total`} />
            </div>

            {Array.isArray(job.applicants) && job.applicants.length > 0 ? (
              <ul className="space-y-2">
                {job.applicants.map((a, i) => (
                  <li key={i} className="border rounded-lg p-3 flex items-center justify-between bg-white">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-base-200 flex items-center justify-center text-sm font-bold">
                        {(a.name || '?').slice(0, 1).toUpperCase()}
                      </div>
                      <div className="leading-tight">
                        <p className="font-medium text-gray-800">{a.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">⭐ {a.rating ?? '—'}</p>
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500 mr-1">Bid:</span>
                      <span className="font-semibold text-green-700">৳{a.price ?? '—'}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 border rounded-lg text-sm text-gray-600 bg-base-100">
                No applicants yet.
              </div>
            )}
          </div>



        </div>
      </div>
    </div>
  );
}
