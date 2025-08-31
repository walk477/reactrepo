import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiPencilAlt, HiTrash, HiSearch, HiPlus } from 'react-icons/hi';
import moment from 'jalali-moment';

// تابع تبدیل تاریخ میلادی به شمسی
const convertToJalali = (gregorianDate) => {
    if (!gregorianDate) return '-';
    return moment(gregorianDate).locale('fa').format('YYYY/MM/DD');
};

// تابع بررسی وضعیت قرارداد
const getContractStatus = (endDate) => {
    if (!endDate) return 'normal';
    
    const today = moment();
    const end = moment(endDate);
    const daysRemaining = end.diff(today, 'days');

    if (daysRemaining < 0) {
        return 'expired'; // قرارداد تمام شده
    } else if (daysRemaining <= 5) {
        return 'warning'; // 5 روز یا کمتر مانده
    }
    return 'normal';
};

// تابع برای دریافت کلاس‌های CSS بر اساس وضعیت قرارداد
const getRowClassName = (endDate) => {
    const status = getContractStatus(endDate);
    const baseClasses = "hover:bg-opacity-90";
    
    switch (status) {
        case 'expired':
            return `${baseClasses} bg-red-100`;
        case 'warning':
            return `${baseClasses} bg-yellow-100`;
        default:
            return `${baseClasses} hover:bg-gray-50`;
    }
};

const CustomersPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    
    // حالت‌های جدید برای جستجو و صفحه‌بندی
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

    // دریافت لیست مشتریان
    const fetchCustomers = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch("http://localhost/api/customers.php/customers", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || "خطا در دریافت اطلاعات");
            
            console.log('First customer complete data:', result[0]); // برای دیدن همه فیلدها
            
            // بررسی ساختار داده‌ها و تبدیل به فرمت مورد نیاز
            const customersData = Array.isArray(result) ? result : [];
            console.log('Customers data:', customersData); // برای دیباگ
            
            setCustomers(customersData);
            setFilteredCustomers(customersData);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // فیلتر کردن مشتریان بر اساس جستجو
    useEffect(() => {
        const filtered = customers.filter(customer => {
            if (!customer) return false;
            const searchLower = searchQuery.toLowerCase();
            
            return (
                (customer.id?.toString() || '').includes(searchLower) ||
                (customer.company_name?.toLowerCase() || '').includes(searchLower) ||
                (customer.contact_person_name?.toLowerCase() || '').includes(searchLower) ||
                (customer.customer_type?.toLowerCase() || '').includes(searchLower) ||
                (customer.contract_end_date?.toLowerCase() || '').includes(searchLower) ||
                (customer.created_by?.toLowerCase() || '').includes(searchLower)
            );
        });
        setFilteredCustomers(filtered);
        setCurrentPage(1); // برگشت به صفحه اول هنگام جستجو
    }, [searchQuery, customers]);

    // محاسبه مشتریان صفحه فعلی
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

    // مرتب‌سازی با پشتیبانی از مقادیر null و undefined
    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        
        const sorted = [...filteredCustomers].sort((a, b) => {
            // مدیریت مقادیر null و undefined
            if (!a[key] && !b[key]) return 0;
            if (!a[key]) return direction === 'asc' ? 1 : -1;
            if (!b[key]) return direction === 'asc' ? -1 : 1;
            
            // مقایسه رشته‌ها با در نظر گرفتن حروف فارسی
            if (typeof a[key] === 'string') {
                return direction === 'asc' 
                    ? a[key].localeCompare(b[key], 'fa')
                    : b[key].localeCompare(a[key], 'fa');
            }
            
            // مقایسه سایر مقادیر
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });
        setFilteredCustomers(sorted);
    };

    // حذف مشتری
    const handleDelete = async (id) => {
        if (!window.confirm('آیا از حذف این مشتری اطمینان دارید؟')) return;
        
        setDeletingId(id);
        try {
            const response = await fetch(`http://localhost/api/customers.php/customers/${id}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "خطا در حذف مشتری");
            
            await fetchCustomers(); // دریافت مجدد لیست
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-800">مدیریت مشتریان</h1>
                <div className="flex gap-4 w-full sm:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                        <HiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="جستجو در مشتریان..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-4 pr-10 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                    <Link
                        to="/admin/customers/new"
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                        <HiPlus className="text-xl" />
                        <span className="font-medium">افزودن مشتری جدید</span>
                    </Link>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-gray-50">
                            <tr>
                                <th 
                                    onClick={() => requestSort('id')} 
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                >
                                    شناسه {sortConfig.key === 'id' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th 
                                    onClick={() => requestSort('company_name')} 
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                >
                                    نام شرکت {sortConfig.key === 'company_name' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th 
                                    onClick={() => requestSort('contact_person_name')} 
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                >
                                    نام مسئول {sortConfig.key === 'contact_person_name' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th 
                                    onClick={() => requestSort('customer_type')} 
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                >
                                    نوع مشتری {sortConfig.key === 'customer_type' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th 
                                    onClick={() => requestSort('contract_end_date')} 
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                >
                                    تاریخ پایان قرارداد {sortConfig.key === 'contract_end_date' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th 
                                    onClick={() => requestSort('created_by')} 
                                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                >
                                    ایجاد کننده {sortConfig.key === 'created_by' && (
                                        <span className="ml-1">
                                            {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    عملیات
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {currentItems.map((customer) => (
                                <tr key={customer?.id} className={getRowClassName(customer?.contract_end_date)}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {customer?.id || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal">
                                        {customer?.company_name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-normal">
                                        {customer?.contact_person_name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {customer?.customer_type === 'normal' ? 'عادی' : customer?.customer_type || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span>
                                                {convertToJalali(customer?.contract_end_date)}
                                            </span>
                                            {customer?.contract_end_date && (
                                                <span className={`inline-flex h-2 w-2 rounded-full ${
                                                    getContractStatus(customer.contract_end_date) === 'expired' 
                                                        ? 'bg-red-500' 
                                                        : getContractStatus(customer.contract_end_date) === 'warning'
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                }`} />
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {customer?.created_by || '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <Link
                                                to={`/admin/customers/edit/${customer.id}`}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <HiPencilAlt className="text-xl" />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                disabled={deletingId === customer.id}
                                                className={`text-red-600 hover:text-red-800 p-0 ${deletingId === customer.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                <HiTrash className="text-xl" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                قبلی
                            </button>
                            <div className="flex gap-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-full ${
                                            currentPage === i + 1
                                                ? 'bg-primary text-white'
                                                : 'hover:bg-gray-100'
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                بعدی
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomersPage;