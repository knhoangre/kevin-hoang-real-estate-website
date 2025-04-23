import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <img
        src="/icon.png"
        alt="Kevin Hoang Real Estate"
        width="80"
        height="80"
        className="flex-shrink-0"
      />
      {/* <span className="ml-2 text-2xl font-bold text-[#1a1a1a] hidden sm:inline-block">Kevin Hoang</span> */}
    </Link>
  );
};

export default Logo;
