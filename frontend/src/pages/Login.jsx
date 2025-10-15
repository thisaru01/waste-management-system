import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login as apiLogin } from "../services/auth";
import { useAuth } from "../context/AuthContext.jsx";
import Input from "../components/ui/Input.jsx";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  // Start with empty fields to avoid default filling
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      signIn(data);
      navigate("/");
    } catch {
      setError("Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-app p-6">
      <form
        onSubmit={onSubmit}
        className="w-80 bg-surface p-6 rounded-lg shadow-md border border-subtle"
        autoComplete="off"
      >
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Sign in to your account
        </h2>

        <Input
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />

        <Input
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-2"
        />

        {error && <div className="mt-3 text-sm text-danger">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-md bg-primary text-white py-2 text-sm hover:opacity-95 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
