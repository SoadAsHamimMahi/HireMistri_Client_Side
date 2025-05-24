// App.jsx
export default function App() {
  return (
    <div className="p-6">
      <h1 className="text-5xl text-blue-600 font-bold underline mb-4">
        Hello Tailwind!
      </h1>

      <div className="hero bg-base-200 min-h-screen">
  <div className="hero-content flex-col lg:flex-row">
    <img
      src="https://img.daisyui.com/images/stock/photo-1635805737707-575885ab0820.webp"
      className="max-w-sm rounded-lg shadow-2xl"
    />
    <div>
      <h1 className="text-5xl font-bold">Box Office News!</h1>
      <p className="py-6">
        Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
        quasi. In deleniti eaque aut repudiandae et a id nisi.
      </p>
      <button className="btn btn-primary">Get Started</button>
    </div>
  </div>
</div>

<button className="btn btn-primary content-center w-full mx-auto">Click Me</button>
<div className="join">
  <div>
    <div>
      <input className="input join-item" placeholder="Search" />
    </div>
  </div>
  <select className="select join-item">
    <option disabled selected>Filter</option>
    <option>Sci-fi</option>
    <option>Drama</option>
    <option>Action</option>
  </select>
  <div className="indicator">
    <span className="indicator-item badge badge-secondary">new</span>
    <button className="btn join-item">Search</button>
  </div>
</div>
      
    </div>
  );
}
