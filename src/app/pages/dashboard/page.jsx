"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Box, Modal } from "@mui/material";
import { MdDelete, MdEdit } from "react-icons/md";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/utils/supabaseClient";
import { toast } from "react-toastify";

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

const Dashboard = () => {
  const { session, signOut, loading } = UserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !session) {
        router.push("/pages/login");
    }
    }, [session, loading, router]);

    if (loading) {
        return <div className="h-screen flex items-center justify-center">Loading...</div>;
    }

  const [blogs, setBlogs] = useState([]);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categoryId, setCategoryId] = useState(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      if (session && session.user) {
        const { data, error } = await supabase
          .from("BlogApp")
          .select("id, title, content, created_at, category_id, Categories(name)")
          .eq("user_id", session.user.id);
  
        if (error) {
          console.error("Error fetching blogs:", error);
        } else {
          setBlogs(data);
        }
      }
    };
    fetchBlogs();
    const blogSubscription = supabase
      .channel("blogs")
      .on("postgres_changes", { event: "*", schema: "public", table: "BlogApp" }, (payload) => {
        console.log("New blog added:", payload);
        fetchBlogs();
      })
      .subscribe();
  
    return () => {
      supabase.removeChannel(blogSubscription);
    };
  }, [session]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("Categories").select("*");
      if (error) {
        console.error("Error fetching categories:", error);
      } else {
        setCategories(data);
      }
    };
  
    fetchCategories();
  
    const categorySubscription = supabase
      .channel("categories")
      .on("postgres_changes", { event: "*", schema: "public", table: "Categories" }, (payload) => {
        console.log("New Category added:", payload);
        fetchCategories();
      })
      .subscribe();
  
    return () => {
      supabase.removeChannel(categorySubscription);
    };
  }, []);
  
  const handleDelete = async (id) => {
    setBlogs(blogs.filter((blog) => blog.id !== id)); // Optimistic UI Update
    
    const { error } = await supabase.from("BlogApp").delete().match({ id });
  
    if (error) {
      console.error("Error deleting blog:", error);
      toast.error("Error deleting blog");
    } else {
      toast.success("Blog Deleted Successfully");
    }
  };

  const handleSignOut = async (e) => {
    e.preventDefault();
  
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
    }
  };

  const handleOpen = (blog = null) => {
    setEditingId(blog?.id || null);
    setTitle(blog?.title || ""); // Ensuring empty string instead of undefined
    setContent(blog?.content || ""); // Ensuring empty string instead of undefined
    setCategoryId(blog?.category_id || null); // Ensuring category_id is null if undefined
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }
  
    if (editingId) {
      const { error } = await supabase
        .from("BlogApp")
        .update({ title, content, category_id: categoryId })
        .match({ id: editingId, user_id: session.user.id });
  
      if (!error) {
        // Fetch the updated blog to get the full data with category
        const { data: updatedBlog } = await supabase
          .from("BlogApp")
          .select("*, Categories(name)")
          .eq("id", editingId)
          .single();
          
        if (updatedBlog) {
          setBlogs(
            blogs.map((blog) =>
              blog.id === editingId ? updatedBlog : blog
            )
          );
        }
        toast.success("Blog updated successfully");
      }
    } else {
      // For inserting a new blog
      const { data: newBlogData, error } = await supabase
        .from("BlogApp")
        .insert([
          { title, content, category_id: categoryId, user_id: session.user.id },
        ])
        .select("*, Categories(name)")
        .single();
  
      if (!error && newBlogData) {
        toast.success("Blog added successfully");
        setBlogs([...blogs, newBlogData]);
      } else {
        toast.error("Error adding blog");
        console.error(error);
      }
    }
    handleClose();
  };
  
  const filteredBlogs = selectedCategory
  ? blogs.filter((blog) => blog.category_id === Number(selectedCategory))
  : blogs;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-black py-4 px-6 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-white font-bold text-2xl cursor-pointer">BLOGS BY AFTAB</h1>
        </Link>
        <div className="flex gap-4">
          <button onClick={handleOpen} className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition cursor-pointer">
            Add Blog
          </button>
          <button onClick={handleSignOut} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer">
            Log Out
          </button>
        </div>
      </nav>

      {/* Content */}
      <div className="container mx-auto py-8 px-6">
        <h1 className="text-4xl font-bold text-center text-gray-800">Aftab's Blogs</h1>
        <p className="text-center text-gray-600 mt-2">A blog with posts on what I like</p>

        <div className="mt-6">
          <select
            className="border p-2 rounded-md"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Blog List */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((blog) => (
            <div key={blog.id} className="bg-white p-6 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{blog.title}</h2>
                <div className="flex gap-2">
                  <MdEdit onClick={() => handleOpen(blog)} className="text-green-500 text-2xl cursor-pointer" />
                  <MdDelete onClick={() => handleDelete(blog.id)} className="text-red-500 text-2xl cursor-pointer" />
                </div>
              </div>
              <p className="text-green-700 mt-2">
                {blog.Categories?.name || "Uncategorized"}
              </p>
              <p className="text-gray-600 mt-4">{blog.content}</p>
              <p className="text-gray-400 text-sm mt-2">{new Date(blog.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Title"
              className="w-full border p-2 rounded-md"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <select
              className="w-full border p-2 rounded-md"
              value={categoryId || ""}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <textarea
              placeholder="Content"
              className="w-full border p-2 rounded-md"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <button type="submit" className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition cursor-pointer">
              {editingId ? "Update" : "Add"} Blog
            </button>
            {/* Pushed */}
          </form>
        </Box>
      </Modal>
    </div>
  );
};

export default Dashboard;
