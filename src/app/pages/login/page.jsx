"use client";

import { UserAuth } from '@/app/context/AuthContext';
import Header from '@/app/modules/Header/page';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Make sure to import the CSS

const Login = () => {
    const router = useRouter();
    const { signInUser } = UserAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState("");

    const handleSignIn = async (e) => {
        e.preventDefault();
        try {
            const result = await signInUser(email, password);
            if (result.success) {
                toast.success("Login Successfully!", {
                    autoClose: 3000
                });
    
                setTimeout(() => {
                    // Redirect will be handled in AuthContext
                }, 2000);
            }
        } catch (err) {
            setError(err.message || "An error occurred");
        }
    };

    return (
        <>
        <Header />
        <div className='flex flex-col items-center justify-center h-screen p-4'>
            <h1 className='text-4xl font-semibold mb-4'>Account Login</h1>
            <form onSubmit={handleSignIn} className='w-full max-w-md space-y-4'>
                {/* Email */}
                <div className='flex flex-col'>
                    <label className='mb-1'>Email Address:</label>
                    <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        className='border-2 p-2 rounded-md focus:outline-none focus:border-black transition duration-200'
                        placeholder='Enter your email'
                        required
                    />
                </div>

                {/* Password */}
                <div className='flex flex-col'>
                    <label className='mb-1'>Password:</label>
                    <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        className='border-2 p-2 rounded-md focus:outline-none focus:border-black transition duration-200'
                        placeholder='Enter your password'
                        required
                    />  
                </div>

                {error && <p className='text-red-600 text-center pt-2'>{error}</p>}

                <button
                    type='submit'
                    className='w-full py-2 mt-4 rounded-md bg-black text-white hover:bg-gray-800 transition duration-200 cursor-pointer'
                >
                    Login
                </button>
            </form>
            <p className='text-slate-600 mt-4'>
                Don't have an account?{' '}
                <Link href='/pages/signup'>
                    <span className='text-black font-medium'>Signup here</span>
                    {/* normal */}
                </Link>
            </p>
        </div>
        
        {/* Configured ToastContainer with longer display time */}
        <ToastContainer 
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
        </>
    );
}

export default Login;
