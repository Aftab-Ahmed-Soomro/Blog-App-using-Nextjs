'use client'

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserAuth } from "@/app/context/AuthContext";
import "react-toastify/dist/ReactToastify.css";

const Dashboard = () => {
  const { session, loading } = UserAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!session) {
        router.push("/pages/login");
      } else {
        const role = session?.user?.user_metadata?.role || "user"; // Correct role access

        if (role === "admin") {
          router.push("/pages/adminDashboard");
        }
      }
    }
  }, [session, loading, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Welcome to User Dashboard</h1>
    </div>
  );
};

export default Dashboard;
