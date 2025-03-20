"use client";

import React, { useState, useEffect, useRef } from "react";
import Header from "@/app/modules/Header/page";
import { supabase } from "@/app/utils/supabaseClient";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdNotifications } from "react-icons/md";

const HomePage = () => {
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const blogChannelRef = useRef(null);
  const categoryChannelRef = useRef(null);

  // Fetch blogs from Supabase
  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from("BlogApp")
      .select("id, title, content, created_at, category_id, Categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Error fetching blogs");
    } else {
      setBlogs(data);
    }
  };

  // Fetch categories from Supabase
  const fetchCategories = async () => {
    const { data, error } = await supabase.from("Categories").select("*");

    if (error) {
      console.error("Error fetching categories:", error);
      toast.error("Error fetching categories");
    } else {
      setCategories(data);
    }
  };

  // Set up Supabase realtime subscriptions
  useEffect(() => {
    const setupRealtimeSubscriptions = async () => {
      // Clean up any existing subscriptions
      if (blogChannelRef.current) {
        await supabase.removeChannel(blogChannelRef.current);
      }
      if (categoryChannelRef.current) {
        await supabase.removeChannel(categoryChannelRef.current);
      }

      // Fetch initial data
      await fetchBlogs();
      await fetchCategories();
      
      // Set up blog changes subscription
      blogChannelRef.current = supabase
        .channel("homepage-blog-changes")
        .on("postgres_changes", 
          { event: "*", schema: "public", table: "BlogApp" }, 
          (payload) => {
            console.log("Realtime blog update received:", payload);
            
            // Define notification message based on event type
            let message = "";
            let title = "";
            
            if (payload.eventType === "INSERT") {
              title = "New Blog Post";
              message = `A new blog "${payload.new.title}" was added`;
              
              // Add new blog to state
              setBlogs(prevBlogs => [payload.new, ...prevBlogs]);
              
              // Show toast
              toast.success(message);
            } 
            else if (payload.eventType === "UPDATE") {
              title = "Blog Updated";
              message = `Blog "${payload.new.title}" was updated`;
              
              // Update blog in state
              setBlogs(prevBlogs =>
                prevBlogs.map(blog => (blog.id === payload.new.id ? payload.new : blog))
              );
              
              // Show toast
              toast.info(message);
            } 
            else if (payload.eventType === "DELETE") {
              title = "Blog Deleted";
              message = `A blog was deleted`;
              
              // Remove blog from state
              setBlogs(prevBlogs => 
                prevBlogs.filter(blog => blog.id !== payload.old.id)
              );
              
              // Show toast
              toast.warning(message);
            }
            
            // Add notification
            const newNotification = {
              id: Date.now(),
              title,
              message,
              time: new Date().toLocaleTimeString(),
              read: false,
              type: payload.eventType === "INSERT" ? "success" : 
                    payload.eventType === "UPDATE" ? "info" : "warning"
            };
            
            setNotifications(prev => [newNotification, ...prev]);
          }
        )
        .subscribe();
      
      // Set up category changes subscription
      categoryChannelRef.current = supabase
        .channel("homepage-category-changes")
        .on("postgres_changes", 
          { event: "*", schema: "public", table: "Categories" }, 
          (payload) => {
            console.log("Realtime category update received:", payload);
            
            // Define notification message based on event type
            let message = "";
            let title = "";
            
            if (payload.eventType === "INSERT") {
              title = "New Category";
              message = `New category "${payload.new.name}" was added`;
              
              // Add category to state
              setCategories(prevCats => [...prevCats, payload.new]);
            } 
            else if (payload.eventType === "UPDATE") {
              title = "Category Updated";
              message = `Category "${payload.new.name}" was updated`;
              
              // Update category in state
              setCategories(prevCats =>
                prevCats.map(cat => (cat.id === payload.new.id ? payload.new : cat))
              );
            } 
            else if (payload.eventType === "DELETE") {
              title = "Category Deleted";
              message = `A category was deleted`;
              
              // Remove category from state
              setCategories(prevCats => 
                prevCats.filter(cat => cat.id !== payload.old.id)
              );
              
              // Reset selected category if it was deleted
              if (selectedCategory === payload.old.id.toString()) {
                setSelectedCategory("");
              }
            }
            
            // Add notification
            const newNotification = {
              id: Date.now(),
              title,
              message,
              time: new Date().toLocaleTimeString(),
              read: false,
              type: payload.eventType === "INSERT" ? "success" : 
                    payload.eventType === "UPDATE" ? "info" : "warning"
            };
            
            setNotifications(prev => [newNotification, ...prev]);
            
            // Show toast
            if (payload.eventType === "INSERT") {
              toast.success(message);
            } else if (payload.eventType === "UPDATE") {
              toast.info(message);
            } else {
              toast.warning(message);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscriptions();

    // Cleanup function
    return () => {
      const cleanup = async () => {
        if (blogChannelRef.current) {
          await supabase.removeChannel(blogChannelRef.current);
        }
        if (categoryChannelRef.current) {
          await supabase.removeChannel(categoryChannelRef.current);
        }
      };
      cleanup();
    };
  }, []);

  // Toggle notifications panel
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    // Mark all as read when opening
    if (!showNotifications) {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    }
  };
  
  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Filter blogs by selected category
  const filteredBlogs = selectedCategory
    ? blogs.filter((blog) => blog.category_id === Number(selectedCategory))
    : blogs;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      {/* Toast notifications container */}
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="container mx-auto py-8 px-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Latest Blogs</h1>
          
          {/* Notification bell */}
          <div className="relative cursor-pointer" onClick={toggleNotifications}>
            <MdNotifications className="text-gray-800 text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Notification Panel */}
        {showNotifications && (
          <div className="fixed top-20 right-30 w-80 bg-white shadow-2xl rounded-xl overflow-hidden transition-all duration-300 z-50">
            {/* Header */}
            <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-lg">Notifications</h3>
              <button
                onClick={clearNotifications}
                className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition"
              >
                Clear All
              </button>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto bg-white">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b flex items-start gap-3 transition-all duration-300 ${
                      notification.read
                        ? "bg-white hover:bg-gray-50"
                        : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                    }`}
                  >
                    {/* Icon */}
                    <span className="text-xl">
                      {notification.type === "success" ? "✅" :
                      notification.type === "warning" ? "⚠️" :
                      notification.type === "info" ? "ℹ️" :
                      "🔔"}
                    </span>

                    {/* Content */}
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{notification.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                        <span>{notification.time}</span>
                        {!notification.read && (
                          <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px]">
                            New
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✖
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  <p className="text-lg font-medium">No new notifications</p>
                  <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Category Filter */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Filter by Category</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("")}
              className={`px-4 py-2 rounded-full ${
                selectedCategory === "" ? "bg-black text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
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
              <div key={blog.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
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