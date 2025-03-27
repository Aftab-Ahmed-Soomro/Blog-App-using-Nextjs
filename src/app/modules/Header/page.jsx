"use-client"

import Link from 'next/link';
import React from 'react';

const Header = () => {
  return (
    <header className='bg-gray-900 shadow-md sticky top-0 z-50'>
      <div className='container mx-auto flex items-center justify-between p-4 lg:p-6'>
        {/* Logo */}
        <Link href={'/'}>
          <h1 className='text-white font-extrabold text-2xl lg:text-4xl tracking-wide transition-transform transform hover:scale-105'>
            BLOGS BY AFTAB
          </h1>
        </Link>

        {/* Navigation */}
        <div className='flex gap-4 lg:gap-6'>
          <Link href={'/pages/signup'}>
            <button className='rounded-full px-5 py-2 text-white border border-white transition-all duration-300 hover:bg-white hover:text-gray-900 hover:shadow-lg'>
              Sign Up
            </button>
          </Link>
          <Link href={'/pages/login'}>
            <button className='rounded-full px-5 py-2 text-white border border-white transition-all duration-300 hover:bg-white hover:text-gray-900 hover:shadow-lg'>
              Login
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
