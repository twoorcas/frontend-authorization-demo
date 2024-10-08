import { useState, useEffect } from "react"; // New import
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import Ducks from "./Ducks";
import Login from "./Login";
import MyProfile from "./MyProfile";
import Register from "./Register";
import AppContext from "../../src/context/AppContext";
import "./styles/App.css";
import ProtectedRoute from "./ProtectedRoute";
import * as auth from "../utils/auth";
import * as api from "../utils/api";
import { getToken, setToken } from "../utils/token";
function App() {
  const [userData, setUserData] = useState({ username: "", email: "" });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  // Invoke the hook. It's necessary to invoke the hook in both
  // components.
  const location = useLocation();

  const handleRegistration = ({
    username,
    email,
    password,
    confirmPassword,
  }) => {
    if (password === confirmPassword) {
      auth
        .register(username, password, email)
        .then(() => {
          navigate("/login");
        })
        .catch(console.error);
    }
  };

  const handleLogin = ({ username, password }) => {
    if (!username || !password) {
      return;
    }

    auth
      .authorize(username, password)
      .then((data) => {
        if (data.jwt) {
          setToken(data.jwt);
          setUserData(data.user);
          setIsLoggedIn(true);

          // After login, instead of navigating always to /ducks,
          // navigate to the location that is stored in state. If
          // there is no stored location, we default to
          // redirecting to /ducks.
          const redirectPath = location.state?.from?.pathname || "/ducks";
          navigate(redirectPath);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    const jwt = getToken();

    if (!jwt) {
      return;
    }

    api
      .getUserInfo(jwt)
      .then(({ username, email }) => {
        setIsLoggedIn(true);
        setUserData({ username, email });
        // Remove the call to the navigate() hook: it's not
        // necessary anymore.
      })
      .catch(console.error);
  }, []);

  return (
    <AppContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
      <Routes>
        <Route
          path="/ducks"
          element={
            <ProtectedRoute>
              <Ducks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfile userData={userData} />
            </ProtectedRoute>
          }
        />
        {/* Wrap our /login route in a ProtectedRoute. Make sure to 
      specify the anoymous prop, to redirect logged-in users 
      to "/". */}
        <Route
          path="/login"
          element={
            <ProtectedRoute anonymous>
              <div className="loginContainer">
                <Login handleLogin={handleLogin} />
              </div>
            </ProtectedRoute>
          }
        />
        {/* Wrap our /register route in a ProtectedRoute. Make sure to
      specify the anoymous prop, to redirect logged-in users 
      to "/". */}
        <Route
          path="/register"
          element={
            <ProtectedRoute anonymous>
              <div className="registerContainer">
                <Register handleRegistration={handleRegistration} />
              </div>
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            isLoggedIn ? (
              <Navigate to="/ducks" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </AppContext.Provider>
  );
}
export default App;
