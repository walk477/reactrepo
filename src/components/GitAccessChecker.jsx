import React, { useState } from 'react';

const GitAccessChecker = ({ token, repoUrl, onAccessChecked }) => {
    const [checking, setChecking] = useState(false);
    const [error, setError] = useState(null);

    const checkAccess = async () => {
        if (!token || !repoUrl) {
            setError('توکن و آدرس مخزن الزامی هستند');
            return;
        }

        setChecking(true);
        setError(null);

        try {
            const response = await fetch('/api/git_local_info.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    repoUrl
                })
            });

            const data = await response.json();

            if (data.success) {
                onAccessChecked({
                    success: true,
                    data: data.data
                });
            } else {
                setError(data.error || 'خطا در بررسی دسترسی به مخزن');
                onAccessChecked({
                    success: false,
                    error: data.error
                });
            }
        } catch (err) {
            const errorMessage = err.message || 'خطا در برقراری ارتباط با سرور';
            setError(errorMessage);
            onAccessChecked({
                success: false,
                error: errorMessage
            });
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="git-access-checker">
            {error && (
                <div className="text-red-500 mb-2">
                    {error}
                </div>
            )}
            <button
                onClick={checkAccess}
                disabled={checking || !token || !repoUrl}
                className={`px-4 py-2 rounded ${
                    checking
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
            >
                {checking ? 'در حال بررسی...' : 'بررسی دسترسی به مخزن'}
            </button>
        </div>
    );
};

export default GitAccessChecker;
