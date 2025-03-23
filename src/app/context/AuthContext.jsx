"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation"; // Import router
import { supabase } from "../utils/supabaseClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  // Redirect User Based on Role
  const handleLoginRedirect = async (userId) => {
    const role = await fetchUserRole(userId);

    if (role === "admin") {
      router.push("/pages/adminDashboard"); // Redirect Admin
    } else {
      router.push("/pages/dashboard"); // Redirect Normal User
    }
  };

  // Sign In Function
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign-in error:", error);
        return { success: false, error: error.message };
      }

      console.log("Sign-in success:", data);
      setSession(data.session); // Store session

      // Redirect based on role
      const userId = data.user?.id;
      if (userId) {
        await handleLoginRedirect(userId);
      }

      return { success: true, data };
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    fetchSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("There was an error: ", error);
    } else {
      setSession(null);
      router.push("/login"); // Redirect to login after sign-out
    }
  };

  // Fetch User Role from Supabase
  const fetchUserRole = async (userId) => {
    console.log("🔍 Fetching role for user ID:", userId);
  
    if (!userId) {
      console.error("❌ User ID is missing!");
      return "user";
    }
  
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
  
    if (error || !data) {
      console.error("❌ Error fetching user role:", error);
      return "user";
    }
  
    console.log("✅ Role fetched:", data.role);
    return data.role;
  };
  

  return (
    <AuthContext.Provider value={{ session, signInUser, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
