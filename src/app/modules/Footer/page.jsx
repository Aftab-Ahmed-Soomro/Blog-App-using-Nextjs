import React from 'react'

const Footer = () => {
  return (
    <footer className='bg-gray-900 text-white py-6 mt-10 shadow-inner'>
      <div className='container mx-auto flex flex-col items-center justify-center'>
        <h1 className='font-extrabold text-2xl lg:text-3xl tracking-wide transition-transform transform hover:scale-105'>
          Code with Aftab
        </h1>
        <p className='text-gray-400 text-sm mt-2'>
          © {new Date().getFullYear()} All rights reserved.
        </p>
      </div>
    </footer>
  )
}

export default Footer