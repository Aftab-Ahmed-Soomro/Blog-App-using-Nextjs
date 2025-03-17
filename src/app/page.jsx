import React from 'react'
import Home from './pages/home/page'
import { ToastContainer } from 'react-toastify';

const page = () => {
  return (
    <div>
      <Home />
      <ToastContainer />
    </div>
  )
}

export default page
