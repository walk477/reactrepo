import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { NavLink, useLocation, Link, useNavigate } from "react-router-dom";
import { logout } from "../../store/authSlice";
import { useSettings } from "../../context/SettingsContext";
import {
  HiHome,
  HiViewGrid,
  HiUserGroup,
  HiUsers,
  HiKey,
  HiCog,
  HiLogout,
  HiUserCircle,
  HiMenu,
  HiX,
  HiBell
} from "react-icons/hi";

const menuItems = [
  { path: "/dashboard", icon: HiViewGrid, title: "داشبورد", permission: "view_dashboard" },
  { path: "/admin/customers", icon: HiUserGroup, title: "مشتریان", permission: "manage_customers" },
  { path: "/", icon: HiUsers, title: "مدیریت کاربران", permission: "manage_users" },
  { path: "/admin/permissions", icon: HiKey, title: "دسترسی‌ها", permission: "manage_permissions" },
  { path: "/admin/settings", icon: HiCog, title: "تنظیمات", permission: "manage_settings" }
];

/**
 * یک هوک سفارشی برای بررسی اینکه آیا کاربر فعلی یک مجوز خاص را دارد یا خیر.
 */
const useHasPermission = (permissionName) => {
    const user = useSelector((state) => state.auth.user);
    // ادمین اصلی (role_id=1) همیشه دسترسی کامل دارد
    if (user?.role_id === 1) {
        return true;
    }
    
    // در غیر این صورت، بررسی کن که آیا مجوز در لیست مجوزهای کاربر وجود دارد یا خیر
    return user?.permissions?.includes(permissionName) || false;
};

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  
  const { token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const { settings, loading } = useSettings();
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  // --- مپ کردن دسترسی‌ها برای هر منو ---
  const permissionMap = {};
  menuItems.forEach(item => {
    permissionMap[item.permission] = useHasPermission(item.permission);
  });

  const navigate = useNavigate();

  // بررسی وضعیت توکن و هدایت به صفحه لاگین در صورت نیاز
  useEffect(() => {
    if (!token && location.pathname !== '/login') {
      navigate('/login');
    }
  }, [token, location.pathname, navigate]);

  const handleLogout = async () => {
    if (token) {
      await fetch("http://localhost/api/users.php/logout", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
    }
    dispatch(logout());
    setIsMenuOpen(false);
    navigate('/login');
  };

  // Fetch notifications
  useEffect(() => {
    if (token) {
      // اینجا می‌تونید اطلاعات نوتیفیکیشن‌ها رو از سرور دریافت کنید
      setNotifications([
        { id: 1, message: "تنظیمات سیستم به‌روزرسانی شد", isNew: true },
        { id: 2, message: "۳ مشتری جدید اضافه شده", isNew: true }
      ]);
    }
  }, [token]);

  const theme = {
    primary_color: settings?.primary_color || "#203961",
    text_color: settings?.text_color || "#333333",
    logo_url: settings?.logo_url || "",
    font_family: settings?.font_family || "Vazirmatn"
  };

  // تابع کمکی برای تنظیم رنگ متن با توجه به تم
  const getTextColor = (type) => {
    switch(type) {
      case 'primary':
        return settings?.text_color || 'text-gray-900';
      case 'secondary':
        return 'text-gray-500 hover:text-gray-700';
      case 'light':
        return 'text-gray-100 hover:text-white';
      default:
        return 'text-gray-700';
    }
  };

  const navLinkStyles = ({ isActive }) => 
    `flex items-center gap-2 transition-all px-4 py-2.5 rounded-lg text-sm font-medium ${
        isActive 
        ? `bg-white/10 ${getTextColor('light')} shadow-sm` 
        : `${getTextColor('light')} hover:bg-white/5`
    }`;
  
  const mobileNavLinkStyles = ({ isActive }) => 
    `flex items-center gap-2 transition-all px-3 py-2.5 text-base font-medium ${
        isActive 
        ? `bg-gray-900 ${getTextColor('light')}` 
        : `${getTextColor('light')} hover:bg-white/10`
    }`;


  const dynamicStyles = {
    backgroundColor: theme.primary_color,
    fontFamily: theme.font_family,
    color: theme.text_color,
    '--primary-color': theme.primary_color,
    '--text-color': theme.text_color,
  };

  return (
    <nav 
      className="sticky top-0 z-50 shadow-lg backdrop-blur-sm bg-opacity-90" 
      style={dynamicStyles}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 h-10 flex items-center">
              {!loading && theme.logo_url ? (
                <img 
                  className="h-full w-auto object-contain transition-transform hover:scale-105" 
                  src={`http://localhost${theme.logo_url}`} 
                  alt="Site Logo" 
                />
              ) : (
                <span className="text-white text-xl font-bold">وب حساب</span>
              )}
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:block mr-10">
              <div className="flex items-center space-x-2 space-x-reverse">
                {token && menuItems.filter(item => permissionMap[item.permission]).map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink 
                      key={item.path} 
                      to={item.path} 
                      className={navLinkStyles}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Menu Section */}
          <div className="flex items-center gap-4">
            {token && (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 text-gray-100 hover:text-white transition-colors"
                  >
                    <HiBell className="w-6 h-6" />
                    {notifications.some(n => n.isNew) && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                  
                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute left-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 text-right">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">اعلان‌ها</h3>
                      </div>
                      {notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className="px-4 py-3 hover:bg-gray-50 flex items-start gap-3"
                        >
                          {notification.isNew && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                          )}
                          <p className={`text-sm ${getTextColor('secondary')}`}>{notification.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-gray-100 hover:text-white transition-colors"
                  >
                    <span className={getTextColor('light')}>{user?.username}</span>
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <HiUserCircle className={`w-6 h-6 ${getTextColor('light')}`} />
                    </div>
                  </button>

                  {/* User Dropdown */}
                  {showUserMenu && (
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        پروفایل کاربری
                      </Link>
                      <Link
                        to="/admin/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        تنظیمات
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        خروج از حساب
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-100 hover:text-white hover:bg-white/10 transition-colors"
            >
              {isMenuOpen ? (
                <HiX className="w-6 h-6" />
              ) : (
                <HiMenu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {token ? (
              <>
                {menuItems.filter(item => permissionMap[item.permission]).map(item => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMenuOpen(false)}
                      className={mobileNavLinkStyles}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  );
                })}
                
                <hr className="border-t border-white/10 my-2" />
                
                <Link
                  to="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg"
                >
                  <HiUserCircle className="w-5 h-5" />
                  <span>پروفایل کاربری</span>
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full text-right px-3 py-2 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-lg"
                >
                  <HiLogout className="w-5 h-5" />
                  <span>خروج از حساب</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-white bg-primary-dark hover:bg-primary rounded-lg transition-colors"
              >
                <HiUserCircle className="w-5 h-5" />
                <span>ورود به حساب</span>
              </Link>
            )}
          </div>
        </div>
      </div>
      </div>
    </nav>
  );
}

export default Navbar;
