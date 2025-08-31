import { useState } from 'react';
import { useSelector } from 'react-redux';

export const useGitOperations = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useSelector((state) => state.auth);

    const fetchWithAuth = (body) => ({
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });

    const checkUpdates = async (customerId) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost/api/git_api.php', 
                fetchWithAuth({ customer_id: customerId }
            ));
            
            if (!response.ok) {
                throw new Error('خطا در دریافت اطلاعات');
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const executeGitCommand = async (customerId, command, repoType, branch = null) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost/api/git_api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    customer_id: customerId,
                    command,
                    repo_type: repoType,
                    branch
                })
            });

            if (!response.ok) {
                throw new Error('خطا در اجرای دستور');
            }

            const data = await response.json();
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        checkUpdates,
        executeGitCommand
    };
};
