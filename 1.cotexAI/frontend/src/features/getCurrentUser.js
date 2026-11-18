import api from "../../utils/axios";

const getCurrentUser = async () => {
    try {
        const { data } = await api.get("/api/auth/me");
        return data;
    } catch (error) {
        if (error.response?.status === 401) {
            return null;
        }

        return null;
    }
};

export default getCurrentUser;