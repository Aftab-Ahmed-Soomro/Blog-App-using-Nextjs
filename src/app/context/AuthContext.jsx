"use client";

import React, { createContext, useState, useEffect, useContext } from "react";
import { supabase } from "../utils/supabaseClient";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // Ensure session loads before rendering

  // Sign Up 
  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.log("There was a problem signing up: ", error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  // Sign in
  const signInUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        console.error("Sign-in error occurred:", error);
        return { success: false, error: error.message };
      }

      console.log("Sign-in success:", data);
      setSession(data.session); // Store session after login
      return { success: true, data };
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false); // Mark session as loaded
    };

    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Sign Out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.log("There was an error: ", error);
    } else {
      setSession(null); // Clear session on sign out
    }
  };

  return (
    <AuthContext.Provider value={{ session, signUpNewUser, signInUser, signOut, loading }}>
      {!loading && children} {/* Prevent rendering until session is loaded */}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  return useContext(AuthContext);
};
