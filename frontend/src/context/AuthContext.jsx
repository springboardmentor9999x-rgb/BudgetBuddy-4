import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";


const AuthContext = createContext();


export const AuthProvider = ({ children }) => {

  // =========================================================
  // Authentication State
  // =========================================================

  const [token, setToken] = useState(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);


  // =========================================================
  // Load Current User
  // =========================================================

  const loadCurrentUser = async () => {

    try {

      const storedToken =
        localStorage.getItem("token");


      // No token
      if (!storedToken) {

        setUser(null);

        return;
      }


      const response =
        await api.get(
          "/auth/me",
          {
            headers: {
              Authorization:
                `Bearer ${storedToken}`,
            },
          }
        );


      setUser(
        response.data
      );


      // Keep localStorage synchronized
      localStorage.setItem(
        "user",
        JSON.stringify(response.data)
      );

    } catch (error) {

      console.error(
        "Failed to load current user:",
        error
      );


      localStorage.removeItem(
        "token"
      );

      localStorage.removeItem(
        "user"
      );


      setToken(null);
      setUser(null);

    } finally {

      setLoading(false);

    }
  };


  // =========================================================
  // Restore Login Session
  // =========================================================

  useEffect(() => {

    loadCurrentUser();

  }, []);


  // =========================================================
  // Signup
  // =========================================================

  const signup = async (data) => {

    const response =
      await api.post(
        "/auth/signup",
        data
      );

    return response.data;
  };


  // =========================================================
  // Verify Email OTP
  // =========================================================

  const verifyEmail = async (
    email,
    code
  ) => {

    const response =
      await api.post(
        "/auth/verify-email",
        null,
        {
          params: {
            email,
            code,
          },
        }
      );

    return response.data;
  };


  // =========================================================
  // Resend Verification OTP
  // =========================================================

  const resendVerification = async (
    email
  ) => {

    const response =
      await api.post(
        "/auth/resend-verification",
        null,
        {
          params: {
            email,
          },
        }
      );

    return response.data;
  };


  // =========================================================
  // Login
  // =========================================================

  const login = async (
    email,
    password
  ) => {

    const formData =
      new URLSearchParams();


    formData.append(
      "username",
      email
    );


    formData.append(
      "password",
      password
    );


    const response =
      await api.post(
        "/auth/login",
        formData
      );


    const accessToken =
      response.data.access_token;


    // Save JWT
    localStorage.setItem(
      "token",
      accessToken
    );


    setToken(
      accessToken
    );


    // Load logged-in user
    const me =
      await api.get(
        "/auth/me",
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );


    setUser(
      me.data
    );


    // Save user information
    localStorage.setItem(
      "user",
      JSON.stringify(me.data)
    );


    return me.data;
  };


  // =========================================================
  // Upgrade to Premium
  // =========================================================

  const upgradeToPremium = async () => {

    try {

      const response =
        await api.post(
          "/auth/upgrade-premium",
          {},
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );


      // -----------------------------------------------------
      // Update user role
      // -----------------------------------------------------

      setUser((previousUser) => {

        if (!previousUser) {
          return previousUser;
        }


        const updatedUser = {
          ...previousUser,
          role: "premium",
        };


        // Keep localStorage synchronized
        localStorage.setItem(
          "user",
          JSON.stringify(updatedUser)
        );


        return updatedUser;

      });


      return response.data;

    } catch (error) {

      console.error(
        "Failed to upgrade to Premium:",
        error
      );


      throw error;
    }
  };


  // =========================================================
  // UPDATE PROFILE IN GLOBAL STATE
  // =========================================================

  const updateUserProfile = (
    profileData
  ) => {

    setUser((previousUser) => {

      if (!previousUser) {
        return previousUser;
      }


      const updatedUser = {
        ...previousUser,

        full_name:
          profileData.full_name ??
          previousUser.full_name,

        email:
          previousUser.email,

        role:
          previousUser.role,

        profile_image:
          profileData.profile_image ??
          previousUser.profile_image ??
          null,
      };


      // Update localStorage
      localStorage.setItem(
        "user",
        JSON.stringify(updatedUser)
      );


      return updatedUser;

    });

  };


  // =========================================================
  // Delete Account
  // =========================================================

  const deleteAccount = async (
    password
  ) => {

    const response =
      await api.delete(
        "/auth/account",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },

          data: {
            password,
          },
        }
      );


    // Remove login information
    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );


    setToken(null);
    setUser(null);


    return response.data;
  };


  // =========================================================
  // Logout
  // =========================================================

  const logout = () => {

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "user"
    );


    setToken(null);
    setUser(null);
  };


  // =========================================================
  // Context
  // =========================================================

  return (
    <AuthContext.Provider
      value={{

        user,

        token,

        loading,


        signup,

        verifyEmail,

        resendVerification,


        login,

        logout,

        deleteAccount,

        upgradeToPremium,

        updateUserProfile,

      }}
    >

      {children}

    </AuthContext.Provider>
  );
};


export const useAuth = () =>
  useContext(
    AuthContext
  );