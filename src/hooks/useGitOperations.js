import { useState } from 'react';
import { useSelector } from 'react-redux';

export const useGitOperations = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const { token } = useSelector((state) => state.auth);

    // Use environment variable or fallback to localhost
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

    const fetchWithAuth = (endpoint, body) => ({
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        },
        body: JSON.stringify(body)
    });

    const handleApiResponse = async (response) => {
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'خطا در عملیات');
        }
        
        if (!data.success) {
            throw new Error(data.message || 'عملیات با خطا مواجه شد');
        }
        
        return data;
    };

    const checkRepositoryStatus = async ({ customerId, projectType }) => {
        setIsLoading(true);
        setError(null);
        try {
            // اول دریافت اطلاعات مشتری
            const customerResponse = await fetch(`${API_BASE_URL}/customers.php/customers/${customerId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const customerData = await customerResponse.json();
            
            if (!customerResponse.ok || !customerData.customer) {
                throw new Error(customerData.error || 'خطا در دریافت اطلاعات مشتری');
            }

            // دریافت تنظیمات سایت
            const settingsResponse = await fetch(`${API_BASE_URL}/git_settings_api.php`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const settingsData = await settingsResponse.json();
            
            if (!settingsResponse.ok) {
                throw new Error(settingsData.error || 'خطا در دریافت تنظیمات');
            }

            const customer = customerData.customer;
            const payload = {
                customerId,
                projectType,
                customerRepoUrl: projectType === 'react' ? customer.git_react_repo : customer.git_php_repo,
                customerBranch: projectType === 'react' ? customer.react_branch : customer.php_branch,
                companyRepoUrl: projectType === 'react' ? settingsData.company_react_repo : settingsData.company_php_repo,
                serverIp: customer.server_ip,
                serverPort: customer.server_port || 22,
                serverUsername: customer.server_username,
                serverPassword: customer.server_password,
                projectPath: customer.project_server_path,
                connectionMethod: customer.preferred_connection || 'https',
                gitUsername: customer.git_username,
                gitAccessToken: customer.git_access_token,
                gitSshKey: customer.git_ssh_key,
                gitSshKeyPublic: customer.git_ssh_key_public
            };

            const response = await fetch(`${API_BASE_URL}/git_status_api.php`, fetchWithAuth(payload));
            const result = await handleApiResponse(response);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updateRepository = async (data) => {
        setIsLoading(true);
        setError(null);
        try {
            // اگر عملیات push باشد، از API متفاوتی استفاده می‌کنیم
            const endpoint = data.operation === 'push' 
                ? `${API_BASE_URL}/git_push_api.php` 
                : `/git_update_api.php`;
            
            const response = await fetch(endpoint, fetchWithAuth(data));
            const result = await handleApiResponse(response);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const checkUpdates = async (customerId) => {
        setIsLoading(true);
        setError(null);
        try {
            // Check repository status first
            const statusResponse = await checkRepositoryStatus({ customerId });
            
            if (statusResponse.status.needsUpdate) {
                // If update is needed, perform the update
                const updateResponse = await updateRepository({ customerId });
                return {
                    ...statusResponse,
                    updateResult: updateResponse
                };
            }
            
            return statusResponse;
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
        checkRepositoryStatus,
        updateRepository,
        checkUpdates,
        clearError: () => setError(null)
    };
};

export default useGitOperations;
