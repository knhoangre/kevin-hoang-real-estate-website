import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className="flex items-center">
      {/*
        icon-192.png (19KB), not icon.png (248KB) — the original was the full
        source image shipped on every page and scaled down to 80x80 in the
        browser. It sits in the fixed navbar, so it loads eagerly at high
        priority rather than lazily.
      */}
      <img
        src="/icon-192.png"
        alt="Kevin Hoang Real Estate"
        width="80"
        height="80"
        className={`block shrink-0 ${className || ''}`}
        fetchPriority="high"
        decoding="async"
      />
      {/* <span className="ml-2 text-2xl font-bold text-[#1a1a1a] hidden sm:inline-block">Kevin Hoang</span> */}
    </div>
  );
};

export default Logo;
