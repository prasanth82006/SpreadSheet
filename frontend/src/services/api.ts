import { useStore } from '../store';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
    const { token } = useStore.getState();
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const fetchDocuments = async () => {
    const res = await fetch(`${API_URL}/documents`, {
        headers: getHeaders()
    });
    return res.json();
};

export const createDocument = async (title: string) => {
    const res = await fetch(`${API_URL}/documents`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title })
    });
    return res.json();
};

export const fetchDocument = async (id: string) => {
    const res = await fetch(`${API_URL}/documents/${id}`, {
        headers: getHeaders()
    });
    return res.json();
};
