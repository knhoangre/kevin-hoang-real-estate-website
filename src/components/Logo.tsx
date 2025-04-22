
import React from 'react';
import { Link } from 'react-router-dom';

const Logo = () => {
  return (
    <Link to="/" className="flex items-center">
      <svg
        width="40"
        height="40"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <rect width="100" height="100" rx="10" fill="#1a1a1a" />
        <text
          x="50"
          y="60"
          fontSize="40"
          fontWeight="bold"
          fontFamily="Arial, sans-serif"
          fill="white"
          textAnchor="middle"
        >
          KH
        </text>
        <path
          d="M15 75 L85 75 L50 90 Z"
          fill="#e11d48"
        />
        <path
          d="M 50 10 L 70 30 L 30 30 Z"
          fill="#e11d48"
        />
      </svg>
      <span className="ml-2 text-2xl font-bold text-[#1a1a1a] hidden sm:inline-block">Kevin Hoang</span>
    </Link>
  );
};

export default Logo;
