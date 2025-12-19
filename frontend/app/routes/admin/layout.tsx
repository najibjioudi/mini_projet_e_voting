// routes/admin/layout.tsx
import type { Route } from "../+types/home";
import { Outlet, Link, redirect } from "react-router";
import { AuthService } from "../../utils/auth";
import { useEffect, useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard - E-Voting" },
    { name: "description", content: "Administrator dashboard" },
  ];
}

export function loader() {
  // Basic check - more thorough check will be in component
  return null;
}

export default function AdminLayout() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = () => {
      const user = AuthService.getUser();
      const hasAdminRole = user?.roles?.includes('ADMIN');
      
      if (!hasAdminRole) {
        window.location.href = '/';
        return;
      }
      
      setIsAdmin(true);
      setIsLoading(false);
    };

    checkAdmin();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Redirect will happen
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
                <span className="text-xl font-bold text-gray-800">E-Vote Admin</span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">Administrator</span>
              <button
                onClick={() => {
                  AuthService.clearTokens();
                  window.location.href = '/';
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                Logout
              </button>
            </div>
          </div>
          
          {/* Admin Sub Navigation */}
          <div className="border-t border-gray-200">
            <div className="flex space-x-8 py-3">
              <Link
                to="/admin"
                className="text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                Dashboard
              </Link>
              <Link
                to="/admin/voters"
                className="text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                Voter Management
              </Link>
              <Link
                to="/admin/elections"
                className="text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                Elections
              </Link>
              <Link
                to="/admin/electors"
                className="text-gray-700 hover:text-indigo-600 font-medium transition"
              >
                Electors
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Outlet />
      </div>
    </div>
  );
}