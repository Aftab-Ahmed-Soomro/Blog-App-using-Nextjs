"use client"

import React, { useState, useEffect } from 'react';
import Header from '@/app/modules/Header/page';
import { supabase } from '@/app/utils/supabaseClient';
import Link from 'next/link';

const HomePage = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    // Fetch all blogs with their categories
    const fetchBlogs = async () => {
      const { data, error } = await supabase
        .from("BlogApp")
        .select("id, title, content, created_at, category_id, Categories(name)")
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching blogs:", error);
      } else {
        setBlogs(data);
      }
    };

    // Fetch all categories
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from("Categories")
        .select("*");
      
      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data);
      }
    };

    fetchBlogs();
    fetchCategories();
  }, []);

  // Filter blogs by selected category
  const filteredBlogs = selectedCategory
    ? blogs.filter((blog) => blog.category_id === Number(selectedCategory))
    : blogs;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto py-8 px-6">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">Latest Blogs</h1>
        
        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === "" 
                  ? "bg-black text-white" 
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              } transition`}
            >
              All
            </button>
            
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id.toString())}
                className={`px-4 py-2 rounded-full ${
                  selectedCategory === category.id.toString() 
                    ? "bg-black text-white" 
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                } transition`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Blog Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.length > 0 ? (
            filteredBlogs.map((blog) => (
              <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold text-gray-900 truncate">{blog.title}</h3>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                      {blog.Categories?.name || "Uncategorized"}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">{blog.content}</p>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-gray-400 text-sm">
                      {new Date(blog.created_at).toLocaleDateString()}
                    </p>
                    {/* <Link href={`/blog/${blog.id}`} className="text-black font-medium hover:underline">
                      Read More
                    </Link> */}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-gray-500 text-lg">No blogs found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;