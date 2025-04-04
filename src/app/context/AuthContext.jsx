"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../utils/supabaseClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Redirect User Based on Role
  const handleLoginRedirect = async (userId) => {
    try {
      const role = await fetchUserRole(userId);
      console.log("Redirecting with role:", role); // Debug log
  
      if (role === "admin") {
        router.push("/pages/adminDashboard");
      } else if (role === "moderator") {
        router.push("/pages/moderatorDashboard");
      } else {
        router.push("/pages/dashboard");
      }
    } catch (error) {
      console.error("Error in handleLoginRedirect:", error);
      router.push("/pages/dashboard"); // Fallback
    }
  };

  // Sign Up Function
  const signUpNewUser = async (email, password, role = "user") => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role // This ensures role is in user_metadata
          }
        }
      });
  
      if (error) {
        console.error("Sign-up error:", error);
        return { success: false, error: error.message };
      }
  
      // Ensure role is also in users table
      if (data.user) {
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            id: data.user.id,
            email: data.user.email,
            role: role // Explicitly set role here
          });
  
        if (insertError) {
          console.error("Error inserting user in database:", insertError);
        }
      }
  
      console.log("Sign-up full data:", data); // Debug log
      return { success: true, data };
    } catch (error) {
      console.error("Unexpected signup error:", error);
      return { success: false, error: error.message };
    }
  };

  // Sign In Function
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) return { success: false, error: error.message };

      setSession(data.session);

      // Redirect based on role
      const userId = data.user?.id;
      if (userId) await handleLoginRedirect(userId);

      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
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
      console.log("There was an error signing out: ", error);
    } else {
      setSession(null);
      router.push("/login");
    }
  };

  // Fetch User Role from Supabase
  const fetchUserRole = async (userId) => {
    if (!userId) {
      console.error("User ID is missing!");
      return "user";
    }
  
    const { data, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", userId)
      .single();
  
    console.log("Fetched user role data:", { data, error }); // Debug log
  
    if (error || !data) {
      console.error("Error fetching user role:", error);
      return "user";
    }
  
    return data.role;
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      signInUser, 
      signUpNewUser, 
      signOut, 
      loading,
      fetchUserRole 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};