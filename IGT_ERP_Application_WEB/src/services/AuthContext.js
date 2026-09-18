
import React, { createContext, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export default AuthContext;

// const API_URL = 'http://192.168.1.3:8000';

const API_URL = 'http://127.0.0.1:8000';

export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => {
        const tokens = localStorage.getItem('authTokens');
        return tokens ? JSON.parse(tokens) : null;
    });

    const [user, setUser] = useState(() => {
        const tokens = localStorage.getItem('authTokens');

        if (tokens) {
            try {
                return jwtDecode(JSON.parse(tokens).access);
            } catch (error) {
                console.error('Invalid token:', error);
                return null;
            }
        }

        return null;
    });

    const history = useNavigate();

    // =========================
    // LOGIN
    // =========================
    const loginUser = useCallback(async (e) => {
        if (e) {
            e.preventDefault();
        }

        try {
            const response = await fetch(`${API_URL}/adm/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: e?.target.username.value,
                    password: e?.target.password.value,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to login');
            }

            const data = await response.json();

            setAuthTokens(data);
            setUser(jwtDecode(data.access));

            localStorage.setItem(
                'authTokens',
                JSON.stringify(data)
            );

            history('/dashboard');

        } catch (error) {
            console.error('Login failed:', error);
            history('/');
        }
    }, [history]);


    // =========================
    // LOGOUT
    // =========================
    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);

        localStorage.removeItem('authTokens');

        history('/');
    }, [history]);


    // =========================
    // GET DATA
    // =========================
    const getData = async (urlpath) => {
        try {
            const response = await fetch(
                `${API_URL}/adm/${urlpath}`,
                {
                    method: 'POST',
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();

            return data;

        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };


    // =========================
    // INSERT
    // =========================
   const insert = async (
    Data,
    urlpath,
    History = null
) => {
    try {

        const response = await fetch(
            `${API_URL}/adm/${urlpath}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(Data),
            }
        );

        // Read Django response
        const responseData = await response.json();

        console.log("API Status:", response.status);
        console.log("API Response:", responseData);

        // If Django returns 400 / 401 / 500 etc.
        if (!response.ok) {

            // Create an error object
            const error = new Error(
                'Failed to create course'
            );

            // Store Django response inside error
            error.responseData = responseData;
            error.status = response.status;

            // IMPORTANT
            // Send error back to Addcourse.jsx
            throw error;
        }

        // Navigate only after successful creation
        if (History) {
            history(History);
        }

        // Return successful response
        return responseData;

    } catch (error) {

        console.error(
            'Creation failed:',
            error.responseData || error.message
        );

        // IMPORTANT
        // Do NOT swallow the error
        throw error;
    }
};

    // =========================
    // UPDATE
    // =========================
    const update = async (
        Data,
        urlpath,
        History = null
    ) => {
        try {
            const response = await fetch(
                `${API_URL}/adm/${urlpath}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(Data),
                }
            );

            if (!response.ok) {
                console.log(response);
                throw new Error('Failed to update');
            }

            if (History) {
                history(History);
            }

        } catch (error) {
            console.error('Update failed:', error);
        }
    };


    // =========================
    // DELETE
    // =========================
    const Delete = async (
        Data,
        urlpath,
        History = null
    ) => {
        try {
            const response = await fetch(
                `${API_URL}/adm/${urlpath}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(Data),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to delete');
            }

            if (History) {
                history(History);
            }

        } catch (error) {
            console.error('Delete operation failed:', error);
        }
    };


    // =========================
    // FETCH
    // =========================
    const Fetch = async (
        Data,
        urlpath
    ) => {
        try {
            const response = await fetch(
                `${API_URL}/adm/${urlpath}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(Data),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await response.json();

            return data;

        } catch (error) {
            console.error('Fetch data failed:', error);
        }
    };


    // =========================
    // CONTEXT
    // =========================
    return (
        <AuthContext.Provider
            value={{
                user,
                authTokens,
                loginUser,
                logoutUser,
                getData,
                insert,
                Delete,
                Fetch,
                update,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

