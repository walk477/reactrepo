// src/auth/login.js
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // کاربر تستی
  const defaultUser = {
    username: "admin",
    password: "1234",
    token: "my-static-token-123",
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost/api/users.php/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        // ✅ تغییر اصلی اینجاست
        // توکن و اطلاعات کاربر را از پاسخ سرور دریافت می‌کنیم
        const { user, token } = data;

        // اطلاعات و توکن را به Redux ارسال می‌کنیم.
        // redux-persist به طور خودکار این state را ذخیره خواهد کرد.
        dispatch(
          login({
            user: user,
            token: token,
            isAuthenticated: true,
          })
        );
        navigate("/dashboard");
      } else {
        alert(data.error || "نام کاربری یا رمز عبور اشتباه است");
      }
    } catch (err) {
      dispatch(loginFailure({ message: err.message }));
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Login Page</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <br />
        <br />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <br />
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
}
