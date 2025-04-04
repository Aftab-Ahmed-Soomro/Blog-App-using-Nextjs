import Header from '@/app/modules/Header/page';
import { supabase } from '@/app/utils/supabaseClient';
import Link from 'next/link';
import React from 'react'

const page = async( {params} ) => {
    const {id} = params;

    const {data : blog,error} = await supabase
        .from("BlogApp")
        .select("*, Categories(name)")
        .eq("id",id)
        .single()
    if (error || !blog) {
        return <div className="text-center text-gray-500 mt-10">Blog not found</div>;
    }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg p-6">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-4xl font-bold text-gray-900">{blog.title}</h1>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              {blog.Categories?.name || "Uncategorized"}
            </span>
          </div>
          <p className="text-gray-600 mt-4 leading-relaxed">{blog.content}</p>
          <p className="text-gray-400 text-sm mt-6">
            {new Date(blog.created_at).toLocaleDateString()}
          </p>
          <Link href="/" className="mt-6 inline-block text-blue-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default page
