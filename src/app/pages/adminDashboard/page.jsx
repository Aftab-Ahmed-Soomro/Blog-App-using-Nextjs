"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/app/context/AuthContext";
import { supabase } from "@/app/utils/supabaseClient";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import Toast CSS

const AdminDashboard = () => {
  const { session, loading } = UserAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [updating, setUpdating] = useState(false);

  // Fetch Users Initially
  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push("/pages/login");
      } else {
        const role = session?.user?.user_metadata?.role || "user";
        if (role !== "admin") {
          router.push("/pages/dashboard");
        } else {
          fetchUsers(); // Load users initially
        }
      }
    }
  }, [session, loading, router]);

  // Function to fetch all users from Supabase
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, role");

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      setUsers(data);
    }
  };

  // Function to update user role
  const updateUserRole = async (userId, newRole) => {
    setUpdating(true);

    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) {
      console.error("Error updating role:", error);
    } else {
    //   toast.success(`User role updated to ${newRole}! ✅`);
    }

    setUpdating(false);
  };

  // ✅ Subscribe to Supabase Realtime Changes
  useEffect(() => {
    const channel = supabase
      .channel("users-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        (payload) => {
          console.log("Realtime Change Detected:", payload);

          // Show a popup when a role changes
          if (payload.eventType === "UPDATE") {
            toast.success(
              `User ${payload.new.email} role updated to ${payload.new.role}! 🔄`
            );
          }

          fetchUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-2">User ID</th>
            <th className="border border-gray-300 p-2">Email</th>
            <th className="border border-gray-300 p-2">Role</th>
            <th className="border border-gray-300 p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="text-center">
              <td className="border border-gray-300 p-2">{user.id}</td>
              <td className="border border-gray-300 p-2">{user.email}</td>
              <td className="border border-gray-300 p-2">{user.role}</td>
              <td className="border border-gray-300 p-2">
                <select
                  value={user.role}
                  onChange={(e) => updateUserRole(user.id, e.target.value)}
                  disabled={updating}
                  className="border p-1"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ToastContainer position="top-right" autoClose={3000} /> {/* Toast Component */}
    </div>
  );
};

export default AdminDashboard;
