"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/utils/supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdEdit, MdDelete } from "react-icons/md";
import { Box, Modal } from "@mui/material";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 500,
  bgcolor: "white",
  borderRadius: "12px",
  boxShadow: 24,
  p: 4,
};

const ModeratorDashboard = () => {
  const { session, signOut, loading } = UserAuth();
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedBlog, setUpdatedBlog] = useState({ title: "", content: "", category_id: "" });
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  // Fetch initial data and set up subscriptions
  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push("/pages/login");
      } else {
        fetchUserRole(session.user.id);
      }
    }
  }, [session, loading]);

  // Verify moderator role
  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase.from("users").select("role").eq("id", userId).single();
    if (error || !data || (data.role !== "moderator" && data.role !== "admin")) {
      router.push("/pages/dashboard");
    }
    setIsRoleLoading(false);
  };

  // Fetch blogs with categories
  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from("BlogApp")
      .select("id, title, content, created_at, category_id, Categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch blogs");
    } else {
      setBlogs(data);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("Categories").select("*");
    if (error) {
      toast.error("Failed to fetch categories");
    } else {
      setCategories(data);
    }
  };

  // Set up realtime subscriptions
  useEffect(() => {
    fetchBlogs();
    fetchCategories();

    // Blogs subscription
    const blogsChannel = supabase
      .channel("blogs-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "BlogApp" }, fetchBlogs)
      .subscribe();

    // Categories subscription
    const categoriesChannel = supabase
      .channel("categories-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "Categories" }, fetchCategories)
      .subscribe();

    return () => {
      supabase.removeChannel(blogsChannel);
      supabase.removeChannel(categoriesChannel);
    };
  }, []);

  // Delete blog
  const deleteBlog = async (blogId) => {
    const { error } = await supabase.from("BlogApp").delete().eq("id", blogId);
    if (error) {
      toast.error("Failed to delete blog");
    } else {
      toast.success("Blog deleted successfully");
      setBlogs(blogs.filter(blog => blog.id !== blogId));
    }
  };

  // Update blog
  const updateBlog = async () => {
    if (!selectedBlog) return;
    
    const { error } = await supabase
      .from("BlogApp")
      .update({
        title: updatedBlog.title,
        content: updatedBlog.content,
        category_id: updatedBlog.category_id
      })
      .eq("id", selectedBlog.id);
      
    if (error) {
      toast.error("Failed to update blog");
    } else {
      toast.success("Blog updated successfully");
      fetchBlogs();
      handleBlogClose();
    }
  };

  // Sign out handler
  const handleSignOut = async (e) => {
    e.preventDefault();
    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    } finally {
      setSigningOut(false);
    }
  };

  // Blog details modal handlers
  const handleBlogOpen = (blog, isEdit = false) => {
    setSelectedBlog(blog);
    setEditMode(isEdit);
    setUpdatedBlog({
      title: blog.title,
      content: blog.content,
      category_id: blog.category_id
    });
    setOpen(true);
  };

  const handleBlogClose = () => {
    setOpen(false);
    setSelectedBlog(null);
    setEditMode(false);
  };

  if (isRoleLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-gray-900 shadow-md sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between p-4 lg:p-6">
          {/* Dashboard Title */}
          <Link href="/">
            <h1 className="text-white font-extrabold text-2xl lg:text-4xl tracking-wide transition-transform transform hover:scale-105">
              MODERATOR DASHBOARD
            </h1>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="px-5 py-2 rounded-full text-white border border-red-500 bg-red-500 transition-all duration-300 hover:bg-red-600 hover:shadow-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={signingOut}
          >
            {signingOut ? 'Signing Out...' : 'Log Out'}
          </button>
        </div>
      </nav>

      <div className="container mx-auto py-8 px-6">
        <h2 className="text-2xl font-bold mb-6">Blog Management</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs.map((blog) => (
            <div key={blog.id} className="bg-white p-6 shadow-md rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 truncate pr-4">{blog.title}</h2>
                <div className="flex items-center space-x-2">
                  <MdEdit 
                    onClick={() => handleBlogOpen(blog, true)} 
                    className="text-green-500 text-2xl cursor-pointer" 
                  />
                  <MdDelete 
                    onClick={() => deleteBlog(blog.id)} 
                    className="text-red-500 text-2xl cursor-pointer" 
                  />
                </div>
              </div>
              <p className="text-gray-600 line-clamp-3 mb-4">{blog.content}</p>
              <div className="flex justify-between items-center">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {blog.Categories?.name || "Uncategorized"}
                </span>
                <p className="text-gray-400 text-sm">
                  {new Date(blog.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Blog Modal - View/Edit */}
      <Modal open={open && selectedBlog} onClose={handleBlogClose}>
        <Box sx={style}>
          <h2 className="text-2xl font-bold mb-4">
            {editMode ? "Edit Blog" : "Blog Details"}
          </h2>
          <input 
            type="text" 
            value={editMode ? updatedBlog.title : selectedBlog?.title || ''} 
            onChange={(e) => setUpdatedBlog({...updatedBlog, title: e.target.value})}
            disabled={!editMode} 
            className={`w-full border p-2 rounded-md mb-4 ${!editMode ? 'bg-gray-100' : ''}`}
          />
          <textarea 
            value={editMode ? updatedBlog.content : selectedBlog?.content || ''} 
            onChange={(e) => setUpdatedBlog({...updatedBlog, content: e.target.value})}
            disabled={!editMode} 
            className={`w-full border p-2 rounded-md mb-4 h-40 ${!editMode ? 'bg-gray-100' : ''}`}
          />
          <div className="flex justify-between mb-4">
            <select 
              value={editMode ? updatedBlog.category_id : selectedBlog?.category_id || ''}
              onChange={(e) => setUpdatedBlog({...updatedBlog, category_id: e.target.value})}
              className="w-full border p-2 rounded-md"
              disabled={!editMode}
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          {editMode ? (
            <div className="flex space-x-4">
              <button 
                onClick={updateBlog} 
                className="flex-1 bg-green-500 text-white py-2 rounded-md"
              >
                Save Changes
              </button>
              <button 
                onClick={handleBlogClose} 
                className="flex-1 bg-gray-500 text-white py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button 
              onClick={handleBlogClose} 
              className="w-full bg-black text-white py-2 rounded-md"
            >
              Close
            </button>
          )}
        </Box>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ModeratorDashboard;