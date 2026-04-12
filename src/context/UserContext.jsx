import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMyProfile } from "../features/user/api/userService";
import { getMe } from "../features/auth/api/authService";

const UserContext = createContext(null);

/**
 * @hook useUser
 * @description Hook untuk mengakses data user global dan fungsi refresh.
 */
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

/**
 * @component UserProvider
 * @description Provider untuk mengelola state user secara global dan menghindari multiple API calls.
 */
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("wesign_token");
    const refreshToken = localStorage.getItem("wesign_refresh_token");

    // Jika tidak ada token sama sekali, jangan hit API (langsung selesai loading)
    if (!token && !refreshToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch profil user dan CSRF token secara paralel
      const [profileResponse, authResponse] = await Promise.all([
        getMyProfile(),
        getMe().catch(() => null), // Jangan gagalkan keseluruhan jika /auth/me error
      ]);

      // ✅ Capture CSRF token dari /auth/me (satu-satunya endpoint yang return csrfToken)
      if (authResponse?.data?.csrfToken) {
        localStorage.setItem("wesign_csrf_token", authResponse.data.csrfToken);
      }

      if (profileResponse?.status === "success") {
        const userData = profileResponse.data;

        // Check user status - jika SUSPENDED, DISABLED, atau status lain tidak aktif, auto-logout
        if (userData?.userStatus && userData.userStatus !== "ACTIVE" && userData.userStatus !== "FREE") {
          console.warn(`[UserContext] User akun ${userData.userStatus}, force logout.`);
          localStorage.removeItem("wesign_token");
          localStorage.removeItem("wesign_refresh_token");
          localStorage.removeItem("wesign_csrf_token");
          localStorage.removeItem("wesign_user");
          localStorage.removeItem("wesign_login_at");
          window.location.href = `/login?status=${userData.userStatus}`;
          return;
        }

        setUser(userData);
      } else {
        setUser(null);
        // Kita tidak set error di sini agar tidak memicu UI crash massal jika token cuma kadaluarsa
      }
    } catch (err) {
      console.error("[UserContext] Failed to fetch user:", err.message);
      // Jika error adalah 401/403, user akan diarahkan oleh ProtectedRoute nanti
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch saat provider mount (aplikasi dibuka)
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * @function refreshUser
   * @description Memaksa update data user (misal setelah edit profil/avatar).
   */
  const refreshUser = async () => {
    await fetchUser();
  };

  /**
   * @function clearUser
   * @description Membersihkan state user (saat logout).
   */
  const clearUser = () => {
    setUser(null);
  };

  const value = {
    user,
    setUser, // Untuk update manual jika diperlukan
    loading,
    error,
    refreshUser,
    clearUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;
