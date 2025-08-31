import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { HiSearch, HiPlus } from "react-icons/hi";
import useHeartbeat from "../hooks/useHeartbeat";

// --- کامپوننت اصلی صفحه Home (داشبورد ادمین) ---
export default function Home() {
  useHeartbeat(60000);

  const { user, token } = useSelector((state) => state.auth);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState("username");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const isAdmin = user?.role_id === 1;
  
  // فیلتر کردن کاربران بر اساس جستجو
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // مرتب‌سازی کاربران
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // صفحه‌بندی
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // تغییر ترتیب مرتب‌سازی
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // تابع برای دریافت لیست کاربران از API
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost/api/users.php/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "خطا در دریافت اطلاعات");
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin, fetchUsers]);

  // ✅ بازنویسی شده: تابع برای حذف یک کاربر با مدیریت خطای بهتر
  const handleDeleteUser = async (userId) => {
    if (!window.confirm(`آیا از حذف کاربر با شناسه ${userId} اطمینان دارید؟`))
      return;

    // پاک کردن خطاهای قبلی
    setError(null);

    try {
      const response = await fetch(
        `http://localhost/api/users.php/users/${userId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const result = await response.json();
      if (response.ok) {
        alert(result.message);
        // رفرش کردن لیست کاربران پس از حذف موفق
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== userId));
      } else {
        throw new Error(result.error || "خطا در حذف کاربر");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // --- منطق رندر ---
  if (!isAdmin) {
    return (
      <h1 className="p-10 text-3xl font-bold text-center text-gray-700">
        به وب‌سایت ما خوش آمدید
      </h1>
    );
  }

  if (isLoading) {
    return (
      <div className="p-10 text-center">در حال بارگذاری لیست کاربران...</div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">مدیریت کاربران</h1>
        <div className="flex gap-4 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="جستجو در کاربران..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <Link
            to="/admin/users/new"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <HiPlus className="text-xl" />
            <span className="font-medium">افزودن کاربر جدید</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-4 text-center text-red-600 bg-red-100 rounded-md">
          {error}
        </div>
      )}

      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-right text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100">
            <tr>
              <th scope="col" className="p-4">
                پروفایل
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("username")}
              >
                <div className="flex items-center gap-2">
                  نام کاربری
                  {sortField === "username" && (
                    <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("email")}
              >
                <div className="flex items-center gap-2">
                  ایمیل
                  {sortField === "email" && (
                    <span>{sortDirection === "asc" ? "↑" : "↓"}</span>
                  )}
                </div>
              </th>
              <th scope="col" className="px-6 py-3">
                نقش
              </th>
              <th scope="col" className="px-6 py-3">
                عملیات
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((u) => (
              <tr key={u.id} className="bg-white border-b hover:bg-gray-50">
                <td className="p-4">
                  <img
                    src={
                      u.profile_image_url
                        ? `http://localhost${u.profile_image_url}`
                        : "https://placehold.co/40x40"
                    }
                    alt={u.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                </td>
                <th scope="row" className="px-6 py-4 font-medium text-gray-900">
                  {u.username}
                </th>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      u.role_id === 1
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {u.role_id == 1 ? "ادمین" : "کاربر"}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-4">
                  {u.role_id == 2 && (
                    <Link
                      to={`/admin/users/edit/${u.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      ویرایش/جزئیات
                    </Link>
                  )}
                  {user.id !== u.id && (
                    <button
                      onClick={() => handleDeleteUser(u.id)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      حذف
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-center items-center gap-4">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded ${
            currentPage === 1
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          قبلی
        </button>
        <span className="text-gray-600">
          صفحه {currentPage} از {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded ${
            currentPage === totalPages
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          بعدی
        </button>
      </div>
    </div>
  );
}
