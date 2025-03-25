"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/utils/supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdDelete, MdEdit, MdNotifications } from "react-icons/md";
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

const notificationStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  maxWidth: "350px",
  zIndex: 9999,
};

const AdminDashboard = () => {
  const { session, signOut, loading } = UserAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Check authentication and role
  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push("/pages/login");
      } else {
        const role = session?.user?.user_metadata?.role || "user";
        if (role !== "admin") {
          router.push("/pages/dashboard");
        } else {
          fetchUsers();
        }
      }
    }
  }, [session, loading, router]);

  // Fetch Users
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role");

    if (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } else {
      setUsers(data);
    }
  };

  // Update User Role
  const updateUserRole = async (userId, newRole) => {
    setUpdating(true);

    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update user role");
    } else {
      addNotification({
        title: "User Role Updated",
        message: `User role changed to ${newRole}`,
        type: "success"
      });
    }

    setUpdating(false);
  };

  // Realtime User Changes
  useEffect(() => {
    const channel = supabase
      .channel("users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        (payload) => {
          console.log("Realtime Change Detected:", payload);

          if (payload.eventType === "UPDATE") {
            addNotification({
              title: "Role Changed",
              message: `User ${payload.new.email} role updated to ${payload.new.role}`,
              type: "info"
            });
          }

          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Notification Helpers
  const addNotification = (notification) => {
    const newNotification = {
      ...notification,
      id: Date.now(),
      time: new Date().toLocaleTimeString(),
      read: false
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true }))
      );
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setShowNotifications(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle Sign Out
  const handleSignOut = async (e) => {
    e.preventDefault();
  
    try {
      await signOut();
      router.push("/");
    } catch (err) {
      console.error("Unexpected error during sign out:", err);
      toast.error("Failed to sign out");
    }
  };

  // Open Edit Modal
  const handleOpen = (user) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleUserEdit = async (e) => {
    e.preventDefault();
    
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ role: selectedUser.role })
        .eq("id", selectedUser.id);

      if (error) {
        console.error("Error updating user:", error);
        toast.error("Failed to update user");
      } else {
        addNotification({
          title: "User Updated",
          message: `User ${selectedUser.email} updated successfully`,
          type: "success"
        });
        handleClose();
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred");
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-black py-4 px-6 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-white font-bold text-2xl cursor-pointer">ADMIN DASHBOARD</h1>
        </Link>
        <div className="flex gap-4 items-center">
          {/* Notification icon with badge */}
          <div className="relative cursor-pointer" onClick={toggleNotifications}>
            <MdNotifications className="text-white text-2xl" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          
          <button onClick={handleSignOut} className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer">
            Log Out
          </button>
        </div>
      </nav>

      {/* Notification Panel */}
      {showNotifications && (
        <div
          style={notificationStyle}
          className="fixed top-16 mt-16 right-5 w-80 bg-white shadow-2xl rounded-xl overflow-hidden transition-all duration-300 animate-fadeIn"
        >
          <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg">Notifications</h3>
            <button
              onClick={clearNotifications}
              className="text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded transition"
            >
              Clear All
            </button>
          </div>

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
                  <span className="text-xl">
                    {notification.type === "success" ? "✅" :
                     notification.type === "warning" ? "⚠️" :
                     notification.type === "info" ? "ℹ️" :
                     "🔔"}
                  </span>

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

      {/* Content */}
      <div className="container mx-auto py-8 px-6">
        <h1 className="text-4xl font-bold text-center text-gray-800">Admin Dashboard</h1>
        <p className="text-center text-gray-600 mt-2">Manage Users and Roles</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white p-6 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{user.email}</h2>
                <div className="flex gap-2">
                  <MdEdit onClick={() => handleOpen(user)} className="text-green-500 text-2xl cursor-pointer" />
                </div>
              </div>
              <p className="text-gray-600 mt-4">Current Role: {user.role}</p>
              <div className="mt-4">
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user.id, e.target.value)}
                  disabled={updating}
                  className="w-full border p-2 rounded-md"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <form onSubmit={handleUserEdit} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">Edit User</h2>
            <input
              type="email"
              value={selectedUser?.email || ''}
              disabled
              className="w-full border p-2 rounded-md bg-gray-100"
            />
            <select
              value={selectedUser?.role || 'user'}
              onChange={(e) => setSelectedUser(prev => ({ ...prev, role: e.target.value }))}
              className="w-full border p-2 rounded-md"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button 
              type="submit" 
              className="w-full bg-black text-white py-2 rounded-md hover:bg-gray-800 transition cursor-pointer"
            >
              Update User
            </button>
          </form>
        </Box>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AdminDashboard;