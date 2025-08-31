import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';

// --- کامپوننت اصلی صفحه مدیریت دسترسی‌ها ---
const PermissionsPage = () => {
    // --- Hooks & State Management ---
    const { token } = useSelector((state) => state.auth);

    const [users, setUsers] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [currentUserPermissions, setCurrentUserPermissions] = useState(new Set());
    
    // State برای فرم ایجاد و ویرایش مجوز
    const [permissionFormData, setPermissionFormData] = useState({ name: '', label: '' });
    const [editingPermissionId, setEditingPermissionId] = useState(null);
    
    // State برای مدیریت وضعیت‌های مختلف UI
    const [loading, setLoading] = useState({ initial: true, userPermissions: false, submittingPermission: false });
    const [togglingPermissionId, setTogglingPermissionId] = useState(null); // برای نمایش لودینگ روی هر تیک
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // --- Data Fetching ---

    // دریافت اطلاعات اولیه (کاربران و مجوزها)
    useEffect(() => {
        if (!token) {
            setLoading({ initial: false, userPermissions: false, submittingPermission: false });
            setError('برای دسترسی به این صفحه باید وارد شوید.');
            return;
        }

        const fetchInitialData = async () => {
            try {
                // به صورت همزمان برای دریافت کاربران و مجوزها تلاش کن
                const [usersRes, permsRes] = await Promise.all([
                    fetch("http://localhost/api/users.php/users", { headers: { "Authorization": `Bearer ${token}` }}),
                    fetch("http://localhost/api/users.php/permissions", { headers: { "Authorization": `Bearer ${token}` }})
                ]);

                if (!usersRes.ok || !permsRes.ok) {
                    const errorData = await (usersRes.ok ? permsRes.json() : usersRes.json());
                    throw new Error(errorData.error || 'شما دسترسی لازم برای مشاهده این صفحه را ندارید.');
                }

                setUsers(await usersRes.json());
                setPermissions(await permsRes.json());
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(prev => ({ ...prev, initial: false }));
            }
        };
        fetchInitialData();
    }, [token]);

    // دریافت مجوزهای یک کاربر خاص، هر زمان که کاربر انتخاب شده تغییر کند
    useEffect(() => {
        if (selectedUser) {
            const fetchUserPermissions = async () => {
                setLoading(prev => ({ ...prev, userPermissions: true }));
                try {
                    const response = await fetch(`http://localhost/api/users.php/users/${selectedUser.id}/permissions`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (response.ok) {
                        setCurrentUserPermissions(new Set(data));
                    } else {
                        throw new Error(data.error || 'خطا در دریافت مجوزهای کاربر');
                    }
                } catch (err) {
                    setError(err.message);
                } finally {
                    setLoading(prev => ({ ...prev, userPermissions: false }));
                }
            };
            fetchUserPermissions();
        }
    }, [selectedUser, token]);

    // --- Event Handlers & API Functions ---

    // تابع برای تخصیص یا لغو یک مجوز برای کاربر
    const handlePermissionToggle = useCallback(async (permissionId, isGranted) => {
        if (!selectedUser) return;

        setTogglingPermissionId(permissionId);
        const action = isGranted ? 'grant' : 'revoke';
        
        const oldPermissions = new Set(currentUserPermissions);
        const newPermissions = new Set(oldPermissions);
        if (isGranted) newPermissions.add(permissionId);
        else newPermissions.delete(permissionId);
        setCurrentUserPermissions(newPermissions);
        
        try {
            const response = await fetch(`http://localhost/api/users.php/users/${selectedUser.id}/permissions`, {
                method: 'POST',
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ permission_id: permissionId, action })
            });
            if (!response.ok) {
                setCurrentUserPermissions(oldPermissions);
                const result = await response.json();
                setError(result.error || 'خطا در تخصیص مجوز.');
            }
        } catch (err) {
            setCurrentUserPermissions(oldPermissions);
            setError('خطا در ارتباط با سرور.');
        } finally {
            setTogglingPermissionId(null);
        }
    }, [selectedUser, token, currentUserPermissions]);

    // تابع برای ایجاد یا ویرایش یک مجوز
    const handlePermissionSubmit = async (e) => {
        e.preventDefault();
        if (!permissionFormData.name.trim() || !permissionFormData.label.trim()) {
            setError('هر دو نام سیستمی و فارسی الزامی است.');
            return;
        }

        setLoading(prev => ({ ...prev, submittingPermission: true }));
        setError(''); setSuccessMessage('');

        const url = editingPermissionId 
            ? `http://localhost/api/users.php/permissions/${editingPermissionId}`
            : "http://localhost/api/users.php/permissions";
        
        const method = editingPermissionId ? 'PUT' : 'POST';
        const body = {
            permission_name: permissionFormData.name,
            permission_label_fa: permissionFormData.label
        };

        try {
            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            const result = await response.json();
            if (response.ok) {
                if (editingPermissionId) {
                    setPermissions(prev => prev.map(p => p.id === editingPermissionId ? { ...p, ...body, id: p.id } : p));
                } else {
                    setPermissions(prev => [...prev, result.permission]);
                }
                setSuccessMessage(result.message);
                cancelEditing();
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور.');
        } finally {
            setLoading(prev => ({ ...prev, submittingPermission: false }));
        }
    };
    
    // تابع برای حذف یک مجوز
    const handleDeletePermission = async (permissionId) => {
        if (!window.confirm("آیا از حذف این مجوز اطمینان دارید؟")) return;
        
        try {
            const response = await fetch(`http://localhost/api/users.php/permissions/${permissionId}`, {
                method: 'DELETE',
                headers: { "Authorization": `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok) {
                setPermissions(prev => prev.filter(p => p.id !== permissionId));
                setSuccessMessage(result.message);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('خطا در ارتباط با سرور.');
        }
    };

    const startEditing = (permission) => {
        setEditingPermissionId(permission.id);
        setPermissionFormData({ name: permission.permission_name, label: permission.permission_label_fa });
    };

    const cancelEditing = () => {
        setEditingPermissionId(null);
        setPermissionFormData({ name: '', label: '' });
    };

    // --- Render Logic ---
    if (loading.initial) {
        return <div className="p-10 text-center">در حال بارگذاری...</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-600 bg-red-100 rounded-md">{error}</div>;
    }
    
    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">مدیریت دسترسی‌ها</h1>
            {successMessage && <p className="text-green-600 mb-4 bg-green-100 p-3 rounded-md">{successMessage}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* ستون لیست کاربران */}
                <div className="md:col-span-1 bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">کاربران</h2>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {users.map(u => (
                            <li key={u.id}>
                                <button onClick={() => setSelectedUser(u)} 
                                    className={`w-full text-right p-2 rounded-md transition-colors ${selectedUser?.id === u.id ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}`}>
                                    {u.username}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* ستون لیست مجوزها */}
                <div className="md:col-span-2 bg-white p-4 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                        مجوزها برای: <span className="text-blue-600">{selectedUser ? selectedUser.username : 'کاربری انتخاب نشده'}</span>
                    </h2>
                    {selectedUser && (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">
                             {loading.userPermissions ? <p>در حال بارگذاری مجوزها...</p> : permissions.map(perm => (
                                <div key={perm.id} className={`flex items-center justify-between p-2 rounded-md transition-opacity ${togglingPermissionId === perm.id ? 'opacity-50' : ''}`}>
                                    <label className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                                        <input type="checkbox"
                                            className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            checked={currentUserPermissions.has(perm.id)}
                                            onChange={(e) => handlePermissionToggle(perm.id, e.target.checked)}
                                            disabled={togglingPermissionId === perm.id}
                                        />
                                        <span className="text-gray-700">{perm.permission_label_fa} <span className="text-xs text-gray-400">({perm.permission_name})</span></span>
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {togglingPermissionId === perm.id && <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>}
                                        <button onClick={() => startEditing(perm)} className="text-xs text-yellow-600 hover:text-yellow-800">ویرایش</button>
                                        <button onClick={() => handleDeletePermission(perm.id)} className="text-xs text-red-600 hover:text-red-800">حذف</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    <hr className="my-6" />

                    {/* فرم ایجاد و ویرایش مجوز */}
                    <form onSubmit={handlePermissionSubmit} className="space-y-3">
                        <h3 className="text-lg font-semibold mb-2">{editingPermissionId ? 'ویرایش مجوز' : 'ایجاد مجوز جدید'}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600">نام سیستمی (انگلیسی)</label>
                                <input 
                                    type="text"
                                    value={permissionFormData.name}
                                    onChange={(e) => setPermissionFormData(p => ({...p, name: e.target.value}))}
                                    placeholder="مثال: edit_posts"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600">نام فارسی</label>
                                <input 
                                    type="text"
                                    value={permissionFormData.label}
                                    onChange={(e) => setPermissionFormData(p => ({...p, label: e.target.value}))}
                                    placeholder="مثال: ویرایش پست‌ها"
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="submit" disabled={loading.submittingPermission} className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300">
                                {loading.submittingPermission ? '...' : (editingPermissionId ? 'ذخیره' : 'ایجاد')}
                            </button>
                            {editingPermissionId && (
                                <button type="button" onClick={cancelEditing} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
                                    لغو
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PermissionsPage;
