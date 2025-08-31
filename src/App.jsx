// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

// کامپوننت‌ها و هوک‌های خود را وارد کنید
import Login from "./auth/login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./auth/ProtectedRoute";
import { logout } from "./store/authSlice";
import useHeartbeat from "./hooks/useHeartbeat"; // مسیر فایل هوک را تنظیم کنید
import Home from "./pages/Home";
import PermissionsPage from "./pages/PermissionsPage"; // مسیر را تنظیم کنید
import SettingsPage from "./pages/SettingsPage";
import { useSettings } from "./context/SettingsContext"; // هوک تنظیمات را وارد کنید
import CreateUserPage from "./pages/CreateUserPage";
import EditUserPage from "./pages/EditUserPage";
import CustomersPage from "./pages/CustomersPage";
import CreateCustomerPage from "./pages/CreateCustomerPage";
import EditCustomerPage from "./pages/EditCustomerPage";
import Navbar from "./components/navbar/Navbar";

const ThemeApplicator = () => {
  const { settings, loading } = useSettings();

  useEffect(() => {
    if (!loading && settings) {
      const root = document.documentElement;
      root.style.setProperty(
        "--font-family",
        settings.font_family || "Vazirmatn"
      );
      root.style.setProperty(
        "--primary-color",
        settings.primary_color || "#203961"
      );
      root.style.setProperty("--text-color", settings.text_color || "#333333");
      document.title = settings.site_title || "وب‌سایت شما";
    }
  }, [settings, loading]);

  // این کامپوننت هیچ چیزی را رندر نمی‌کند
  return null;
};

/**
 * این کامپوننت داخلی وظیفه مدیریت مسیرها و فراخوانی هوک heartbeat را دارد.
 * قرار دادن آن در داخل Router تضمین می‌کند که به هوک‌های react-router-dom دسترسی دارد.
 */
const AppRoutes = () => {
  // این هوک به صورت خودکار در پس‌زمینه کار می‌کند و فعالیت کاربر را ثبت می‌کند
  useHeartbeat(60000); // ارسال ضربان قلب هر ۶۰ ثانیه

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/permissions"
        element={
          <ProtectedRoute>
            <PermissionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/users/new"
        element={
          <ProtectedRoute>
            <CreateUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users/edit/:userId"
        element={
          <ProtectedRoute>
            <EditUserPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute>
            <CustomersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers/new"
        element={
          <ProtectedRoute>
            <CreateCustomerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers/edit/:customerId"
        element={
          <ProtectedRoute>
            <EditCustomerPage />
          </ProtectedRoute>
        }
      />

      {/* می‌توانید سایر مسیرهای محافظت شده یا عمومی را در اینجا اضافه کنید */}
    </Routes>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const token = useSelector((state) => state.auth.token);
  const dispatch = useDispatch();
  const { settings, loading } = useSettings();

  console.log(settings, loading);

  // ✅ راه‌حل: تعریف مقادیر پیش‌فرض برای جلوگیری از خطا هنگام null بودن settings
  const theme = {
    primary_color: settings?.primary_color || "#203961",
    font_family: settings?.font_family || "Vazirmatn",
    text_color: settings?.text_color || "#333333",
    logo_url: settings?.logo_url || "",
  };

  return (
    <Router>
      <ThemeApplicator /> {/* کامپوننت اعمال تم را اینجا قرار دهید */}
      {/* نوار ناوبری (Navigation Bar) */}
      <Navbar />
      {/* محتوای اصلی و مسیرها */}
      <main
        className="container mx-auto p-4"
        style={{ fontFamily: theme.font_family, color: theme.text_color }}
      >
        <AppRoutes />
      </main>
    </Router>
  );
}
