// src/routes/Home.jsx
import { Link } from 'react-router-dom';
import Banner from './Banner';
import PopularCategories from './PopularCategories';
import PopularWarkers from './PopularWarkers';

export default function Home() {
  return (
    <div className="min-h-screen text-slate-300 pb-20">
      <Banner></Banner>
      <PopularCategories></PopularCategories>
      <PopularWarkers></PopularWarkers>
    </div>
  );
}
