"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/utils/supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { MdEdit, MdNotifications } from "react-icons/md";
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

const AdminDashboard = () => {
  const { session, signOut, loading } = UserAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleLoading, setIsRoleLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push("/pages/login");
      } else {
        fetchUserRole(session.user.id);
      }
    }
  }, [session, loading]);

  const fetchUserRole = async (userId) => {
    const { data, error } = await supabase.from("users").select("role").eq("id", userId).single();
    if (error || !data || data.role !== "admin") {
      router.push("/pages/dashboard");
    }
    setIsRoleLoading(false);
  };

  const fetchUsers = async () => {
    const { data, error } = await supabase.from("users").select("id, email, role");
    if (error) {
      toast.error("Failed to fetch users");
    } else {
      setUsers(data);
    }
  };

  useEffect(() => {
    fetchUsers();
    const channel = supabase
      .channel("users-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "users" }, fetchUsers)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const updateUserRole = async (userId, newRole) => {
    const { error } = await supabase.from("users").update({ role: newRole }).eq("id", userId);
    if (error) {
      toast.error("Failed to update user role");
    } else {
      setUsers(users.map(user => (user.id === userId ? { ...user, role: newRole } : user)));
    }
  };

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

  const handleOpen = (user) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  if (isRoleLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-black py-4 px-6 flex items-center justify-between">
        <Link href="/">
          <h1 className="text-white font-bold text-2xl cursor-pointer">ADMIN DASHBOARD</h1>
        </Link>
        <button onClick={handleSignOut} className="px-4 py-2 bg-red-500 text-white rounded-md" disabled={signingOut}>
          {signingOut ? "Signing Out..." : "Log Out"}
        </button>
      </nav>

      <div className="container mx-auto py-8 px-6">
        <h1 className="text-4xl font-bold text-center text-gray-800">Admin Dashboard</h1>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="bg-white p-6 shadow-md rounded-lg">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">{user.email}</h2>
                <MdEdit onClick={() => handleOpen(user)} className="text-green-500 text-2xl cursor-pointer" />
              </div>
              <p className="text-gray-600 mt-4">Current Role: {user.role}</p>
              <select value={user.role} onChange={(e) => updateUserRole(user.id, e.target.value)} className="w-full border p-2 rounded-md">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      <Modal open={open} onClose={handleClose}>
        <Box sx={style}>
          <h2 className="text-2xl font-bold mb-4">Edit User</h2>
          <input type="email" value={selectedUser?.email || ''} disabled className="w-full border p-2 rounded-md bg-gray-100" />
          <select value={selectedUser?.role || 'user'} onChange={(e) => setSelectedUser(prev => ({ ...prev, role: e.target.value }))} className="w-full border p-2 rounded-md">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleClose} className="w-full bg-black text-white py-2 rounded-md mt-4">Close</button>
        </Box>
      </Modal>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default AdminDashboard;
