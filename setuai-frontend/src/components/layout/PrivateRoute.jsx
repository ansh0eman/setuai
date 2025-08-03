import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";

const PrivateRoute = ({ children }) => {
  console.log("PrivateRoute: Rendering");
  
  try {
    const { token } = useAuth();
    console.log("PrivateRoute: Token exists:", !!token);
    
    if (!token) {
      console.log("PrivateRoute: No token, redirecting to login");
      return <Navigate to="/login" replace />;
    }
    
    console.log("PrivateRoute: Token exists, rendering children");
    return children;
  } catch (error) {
    console.error("PrivateRoute: AuthProvider not available:", error);
    return <Navigate to="/login" replace />;
  }
};

export default PrivateRoute; 