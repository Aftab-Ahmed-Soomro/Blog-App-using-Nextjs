// "use client";

// import React, { useState, useEffect, useRef } from "react";
// import Link from "next/link";
// import { Box, Modal } from "@mui/material";
// import { MdDelete, MdEdit, MdNotifications } from "react-icons/md";
// import { useRouter } from "next/navigation";
// import { UserAuth } from "@/app/context/AuthContext";
// import { supabase } from "@/app/utils/supabaseClient";
// import { toast, ToastContainer } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css"; // Make sure to import the CSS

// const style = {
//   position: "absolute",
//   top: "50%",
//   left: "50%",
//   transform: "translate(-50%, -50%)",
//   width: 500,
//   bgcolor: "white",
//   borderRadius: "12px",
//   boxShadow: 24,
//   p: 4,
// };

// // Notification popup styles
// const notificationStyle = {
//   position: "fixed",
//   top: "20px",
//   right: "20px",
//   maxWidth: "350px",
//   zIndex: 9999,
// };

// const Dashboard = () => {
//   const { session, signOut, loading } = UserAuth();
//   const router = useRouter();
//   const blogChannelRef = useRef(null);
//   const categoryChannelRef = useRef(null);

//   useEffect(() => {
//     if (!loading && !session) {
//       router.push("/pages/login");
//     }
//   }, [session, loading, router]);

//   if (loading) {
//     return <div className="h-screen flex items-center justify-center">Loading...</div>;
//   }

//   const [blogs, setBlogs] = useState([]);
//   const [open, setOpen] = useState(false);
//   const [title, setTitle] = useState("");
//   const [content, setContent] = useState("");
//   const [editingId, setEditingId] = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [categoryId, setCategoryId] = useState(null);
  
//   // Notification state
//   const [notifications, setNotifications] = useState([]);
//   const [showNotifications, setShowNotifications] = useState(false);

//   const fetchBlogs = async () => {
//     if (session && session.user) {
//       const { data, error } = await supabase
//         .from("BlogApp")
//         .select("id, title, content, created_at, category_id, Categories(name)")
//         .eq("user_id", session.user.id)
//         .order("created_at", { ascending: false });

//       if (error) {
//         console.error("Error fetching blogs:", error);
//         toast.error("Failed to fetch blogs");
//       } else {
//         setBlogs(data);
//       }
//     }
//   };

//   // Set up Supabase realtime subscriptions
//   useEffect(() => {
//     if (!session || !session.user) return;

//     const setupRealtimeSubscriptions = async () => {
//       // Make sure we clean up any existing subscriptions
//       if (blogChannelRef.current) {
//         await supabase.removeChannel(blogChannelRef.current);
//       }
//       if (categoryChannelRef.current) {
//         await supabase.removeChannel(categoryChannelRef.current);
//       }

//       // Fetch initial data
//       await fetchBlogs();
//       await fetchCategories();
      
//       // Set up blog changes subscription
//       blogChannelRef.current = supabase
//         .channel("blog-changes")
//         .on("postgres_changes", 
//           { event: "*", schema: "public", table: "BlogApp" }, 
//           (payload) => {
//             console.log("Blog change detected:", payload);
            
//             // Define notification message based on event type
//             let message = "";
//             let title = "";
            
//             if (payload.eventType === "INSERT") {
//               title = "New Blog Post";
//               message = `A new blog "${payload.new.title}" was added`;
              
//               // Only update UI for own user's posts
//               if (payload.new.user_id === session.user.id) {
//                 fetchBlogs();
//               }
//             } 
//             else if (payload.eventType === "UPDATE") {
//               title = "Blog Updated";
//               message = `Blog "${payload.new.title}" was updated`;
              
//               // Update UI if current user's post was updated
//               if (payload.new.user_id === session.user.id) {
//                 fetchBlogs();
//               }
//             } 
//             else if (payload.eventType === "DELETE") {
//               title = "Blog Deleted";
//               message = `A blog was deleted`;
              
//               // Refresh all blogs on delete event
//               fetchBlogs();
//             }
            
//             // Add notification
//             const newNotification = {
//               id: Date.now(),
//               title,
//               message,
//               time: new Date().toLocaleTimeString(),
//               read: false
//             };
            
//             setNotifications(prev => [newNotification, ...prev]);
            
//             // Show toast
//             toast.success(message);
//           }
//         )
//         .subscribe();
      
//       // Set up category changes subscription
//       categoryChannelRef.current = supabase
//         .channel("category-changes")
//         .on("postgres_changes", 
//           { event: "*", schema: "public", table: "Categories" }, 
//           (payload) => {
//             console.log("Category change detected:", payload);
            
//             // Define notification message based on event type
//             let message = "";
//             let title = "";
            
//             if (payload.eventType === "INSERT") {
//               title = "New Category";
//               message = `New category "${payload.new.name}" was added`;
//             } 
//             else if (payload.eventType === "UPDATE") {
//               title = "Category Updated";
//               message = `Category "${payload.new.name}" was updated`;
//             } 
//             else if (payload.eventType === "DELETE") {
//               title = "Category Deleted";
//               message = `A category was deleted`;
//             }
            
//             // Add notification
//             const newNotification = {
//               id: Date.now(),
//               title,
//               message,
//               time: new Date().toLocaleTimeString(),
//               read: false
//             };
            
//             setNotifications(prev => [newNotification, ...prev]);
            
//             // Update categories
//             fetchCategories();
            
//             // Show toast
//             toast.success(message);
//           }
//         )
//         .subscribe();
//     };

//     setupRealtimeSubscriptions();

//     // Cleanup function
//     return () => {
//       const cleanup = async () => {
//         if (blogChannelRef.current) {
//           await supabase.removeChannel(blogChannelRef.current);
//         }
//         if (categoryChannelRef.current) {
//           await supabase.removeChannel(categoryChannelRef.current);
//         }
//       };
//       cleanup();
//     };
//   }, [session]);

//   const fetchCategories = async () => {
//     const { data, error } = await supabase.from("Categories").select("*");
//     if (error) {
//       console.error("Error fetching categories:", error);
//       toast.error("Failed to fetch categories");
//     } else {
//       setCategories(data);
//     }
//   };
  
//   const handleDelete = async (id) => {
//     try {
//       const { error } = await supabase.from("BlogApp").delete().match({ id });
  
//       if (error) {
//         console.error("Error deleting blog:", error);
//         toast.error("Error deleting blog");
//       } 
//       // We'll let the realtime subscription handle the UI update and toast
//     } catch (err) {
//       console.error("Unexpected error during deletion:", err);
//       toast.error("An unexpected error occurred");
//     }
//   };

//   const handleSignOut = async (e) => {
//     e.preventDefault();
  
//     try {
//       await signOut();
//       router.push("/");
//     } catch (err) {
//       console.error("Unexpected error during sign out:", err);
//       toast.error("Failed to sign out");
//     }
//   };

//   const handleOpen = (blog = null) => {
//     setEditingId(blog?.id || null);
//     setTitle(blog?.title || "");
//     setContent(blog?.content || "");
//     setCategoryId(blog?.category_id || null);
//     setOpen(true);
//   };

//   const handleClose = () => setOpen(false);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!categoryId) {
//       toast.error("Please select a category");
//       return;
//     }
  
//     try {
//       if (editingId) {
//         const { error } = await supabase
//           .from("BlogApp")
//           .update({ title, content, category_id: categoryId })
//           .match({ id: editingId, user_id: session.user.id });
  
//         if (error) {
//           console.error("Error updating blog:", error);
//           toast.error("Failed to update blog");
//           return;
//         }
//         // Toast will be shown by realtime subscription
//       } else {
//         // For inserting a new blog
//         const { error } = await supabase
//           .from("BlogApp")
//           .insert([
//             { title, content, category_id: categoryId, user_id: session.user.id },
//           ]);
  
//         if (error) {
//           console.error("Error adding blog:", error);
//           toast.error("Failed to add blog");
//           return;
//         }
//         // Toast will be shown by realtime subscription
//       }
      
//       handleClose();
//     } catch (err) {
//       console.error("Unexpected error:", err);
//       toast.error("An unexpected error occurred");
//     }
//   };
  
//   const toggleNotifications = () => {
//     setShowNotifications(!showNotifications);
//     // Mark all as read when opening
//     if (!showNotifications) {
//       setNotifications(prev => 
//         prev.map(notif => ({ ...notif, read: true }))
//       );
//     }
//   };
  
//   const clearNotifications = () => {
//     setNotifications([]);
//     setShowNotifications(false);
//   };

//   const unreadCount = notifications.filter(n => !n.read).length;

//   const filteredBlogs = selectedCategory
//     ? blogs.filter((blog) => blog.category_id === Number(selectedCategory))
//     : blogs;

//   return (
//     <div className="min-h-screen bg-gray-100">
//       {/* Navbar */}
//       <nav className="bg-black py-4 px-6 flex items-center justify-between">
//         <Link href="/">
//           <h1 className="text-white font-bold text-2xl cursor-pointer">BLOGS BY AFTAB</h1>
//         </Link>
//         <div className="flex gap-4 items-center">
//           {/* Notification icon with badge */}
//           <div className="relative cursor-pointer" onClick={toggleNotifications}>
//             <MdNotifications className="text-white text-2xl" />
//             {unreadCount > 0 && (
//               <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//                 {unreadCount}
//               </span>
//             )}
//           </div>
          
//           <button onClick={handleOpen} className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 transition cursor-pointer">
//             Add Blog
//           </button>
//           <button onClick={handleSignOut} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer">
//             Log Out
//           </button>
//         </div>
//       </nav>

//       {/* Notification Panel */}
//       {showNotifications && (
//   <div
//     style={notificationStyle}
//     className="fixed top-16 mt-16 right-5 w-80 bg-white shadow-2xl rounded-xl overflow-hidden transition-all duration-300 animate-fadeIn"
//   >
//     {/* Header */}
//     <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
//       <h3 className="font-bold text-lg">Notifications</h3>
//       <button
//         onClick={clearNotifications}
//         className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition"
//       >
//         Clear All
//       </button>
//     </div>

//     {/* Notification List */}
//     <div className="max-h-96 overflow-y-auto bg-white">
//       {notifications.length > 0 ? (
//         notifications.map((notification) => (
//           <div
//             key={notification.id}
//             className={`p-4 border-b flex items-start gap-3 transition-all duration-300 ${
//               notification.read
//                 ? "bg-white hover:bg-gray-50"
//                 : "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
//             }`}
//           >
//             {/* Icon */}
//             <span className="text-xl">
//               {notification.type === "success" ? "✅" :
//                notification.type === "warning" ? "⚠️" :
//                notification.type === "info" ? "ℹ️" :
//                "🔔"}
//             </span>

//             {/* Content */}
//             <div className="flex-1 pt-12">
//               <h4 className="font-semibold text-gray-900">{notification.title}</h4>
//               <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
//               <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
//                 <span>{notification.time}</span>
//                 {!notification.read && (
//                   <span className="bg-blue-500 text-white px-2 py-0.5 rounded-full text-[10px]">
//                     New
//                   </span>
//                 )}
//               </div>
//             </div>

//             {/* Close Button */}
//             <button
//               onClick={() => setNotifications(notifications.filter(n => n.id !== notification.id))}
//               className="text-gray-400 hover:text-gray-600"
//             >
//               ✖
//             </button>
//           </div>
//         ))
//       ) : (
//         <div className="p-6 text-center text-gray-500">
//           <p className="text-lg font-medium">No new notifications</p>
//           <p className="text-sm text-gray-400 mt-1">You're all caught up!</p>
//         </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Content */}
//       <div className="container mx-auto py-8 px-6">
//         <h1 className="text-4xl font-bold text-center text-gray-800">Aftab's Blogs</h1>
//         <p className="text-center text-gray-600 mt-2">A blog with posts on what I like</p>

//         <div className="mt-6">
//           <select
//             className="border p-2 rounded-md"
//             value={selectedCategory}
//             onChange={(e) => setSelectedCategory(e.target.value)}
//           >
//             <option value="">All Categories</option>
//             {categories.map((cat) => (
//               <option key={cat.id} value={cat.id.toString()}>
//                 {cat.name}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Blog List */}
//         <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredBlogs.length > 0 ? (
//             filteredBlogs.map((blog) => (
//               <div key={blog.id} className="bg-white p-6 shadow-md rounded-lg">
//                 <div className="flex justify-between items-center">
//                   <h2 className="text-xl font-bold text-gray-900">{blog.title}</h2>
//                   <div className="flex gap-2">
//                     <MdEdit onClick={() => handleOpen(blog)} className="text-green-500 text-2xl cursor-pointer" />
//                     <MdDelete onClick={() => handleDelete(blog.id)} className="text-red-500 text-2xl cursor-pointer" />
//                   </div>
//                 </div>
//                 <p className="text-green-700 mt-2">
//                   {blog.Categories?.name || "Uncategorized"}
//                 </p>
//                 <p className="text-gray-600 mt-4">{blog.content}</p>
//                 <p className="text-gray-400 text-sm mt-2">{new Date(blog.created_at).toLocaleString()}</p>
//               </div>
//             ))
//           ) : (
//             <div className="col-span-3 text-center py-10">
//               <p className="text-gray-500">No blogs found. Create your first blog!</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Modal */}
//       <Modal open={open} onClose={handleClose}>
//         <Box sx={style}>
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <input
//               type="text"
//               placeholder="Title"
//               className="w-full border p-2 rounded-md"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               required
//             />
//             <select
//               className="w-full border p-2 rounded-md"
//               value={categoryId || ""}
//               onChange={(e) => setCategoryId(Number(e.target.value))}
//               required
//             >
//               <option value="">Select Category</option>
//               {categories.map((cat) => (
//                 <option key={cat.id} value={cat.id}>
//                   {cat.name}
//                 </option>
//               ))}
//             </select>
//             <textarea
//               placeholder="Content"
//               className="w-full border p-2 rounded-md h-40"
//               value={content}
//               onChange={(e) => setContent(e.target.value)}
//               required
//             />
//             <button type="submit" className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition cursor-pointer">
//               {editingId ? "Update" : "Add"} Blog
//             </button>
//           </form>
//         </Box>
//       </Modal>
//       <ToastContainer position="top-right" autoClose={3000} />
//     </div>
//   );
// };

// export default Dashboard;