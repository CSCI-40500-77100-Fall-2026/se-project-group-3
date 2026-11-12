import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import axios from "axios";
import { API_URL } from "../api.js";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    await axios.post(
      `${API_URL}/users/signout`,
      {},
      {
        withCredentials: true
      }
    );

    setUser(null);
  };

  useEffect(() => {

    const getCurrentUser = async () => {
      try {

        const response = await axios.get(
          `${API_URL}/users/me`,
          {
            withCredentials: true
          }
        );

        setUser(response.data.user);

      } catch (error) {

        setUser(null);

      } finally {

        setLoading(false);

      }
    };

    getCurrentUser();

  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        signOut,
        loading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}