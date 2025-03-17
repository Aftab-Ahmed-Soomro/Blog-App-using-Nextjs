"use-client"

import Link from 'next/link';
import React from 'react';

const Header = () => {
  return (
    <div>
      <div className='bg-black flex items-center justify-between p-4 flex-wrap'>
        <Link href={'/'}>
          <h1 className='text-white font-bold text-xl lg:text-3xl cursor-pointer'>
            BLOGS BY AFTAB
          </h1>
        </Link>
        <div className='flex gap-4 lg:gap-6 mt-2 lg:mt-0'>
          <Link href={'/pages/signup'}>
            <button className='rounded px-4 py-2 text-white border border-white transition duration-200 hover:bg-white hover:text-black cursor-pointer'>
              Sign Up
            </button>
          </Link>
          <Link href={'/pages/login'}>
            <button className='rounded px-4 py-2 text-white border border-white transition duration-200 hover:bg-white hover:text-black cursor-pointer'>
              Login
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Header;
