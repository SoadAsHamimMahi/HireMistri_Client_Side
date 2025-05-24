// src/routes/Home.jsx
import { Link } from 'react-router-dom';
import Banner from './Banner';
import PopularCategories from './PopularCategories';
import PopularWarkers from './PopularWarkers';

export default function Home() {
  return (
    <div className="">
      
      <Banner></Banner>

    <PopularCategories></PopularCategories>
      <PopularWarkers></PopularWarkers>
     
    </div>
  );
}
