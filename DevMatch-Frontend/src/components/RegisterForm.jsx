import React, { useState } from "react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    user_name: "",
    email_address: "",
    password: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { fetchUserSession } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { user_name, email_address, password } = formData;
    if (!user_name || !email_address || !password) {
      toast.error("Please fill all fields!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Account created!");
        await fetchUserSession();
        navigate("/edit-profile");
      } else {
        toast.warning(data.error || "Registration failed");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#EEF2FB",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cline x1='0' y1='0' x2='80' y2='80' stroke='%23C7D3EE' stroke-width='0.6'/%3E%3Cline x1='80' y1='0' x2='0' y2='80' stroke='%23D8E0F2' stroke-width='0.4'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='80' r='2' fill='%23C7D3EE'/%3E%3Ccircle cx='80' cy='0' r='1.5' fill='%23D8E0F2'/%3E%3Ccircle cx='0' cy='80' r='1.5' fill='%23D8E0F2'/%3E%3C/svg%3E")`,
        backgroundSize: "80px 80px",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "30px 16px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#2952A3",
              color: "#fff",
              fontSize: "1.4rem",
              marginBottom: 12,
              boxShadow: "0 4px 16px rgba(41,82,163,0.3)",
            }}
          >
            🎯
          </div>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "1.6rem",
              color: "#1E2B4A",
              margin: 0,
            }}
          >
            Dev<span style={{ color: "#2952A3" }}>Match</span>
          </h1>
          <p style={{ color: "#8A9BBC", fontSize: "0.85rem", marginTop: 4 }}>
            Connect. Collaborate. Build.
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 8px 32px rgba(41,82,163,0.10)",
            padding: "32px 28px",
          }}
        >
          <h4 style={{ fontWeight: 700, color: "#1E2B4A", marginBottom: 6 }}>
            Create an account
          </h4>
          <p
            style={{ color: "#8A9BBC", fontSize: "0.85rem", marginBottom: 24 }}
          >
            Join DevMatch and start collaborating
          </p>

          <form onSubmit={handleSubmit}>
            {[
              {
                label: "Username",
                key: "user_name",
                type: "text",
                placeholder: "yourhandle",
              },
              {
                label: "Email address",
                key: "email_address",
                type: "email",
                placeholder: "you@example.com",
              },
            ].map(({ label, key, type, placeholder }) => (
              <div className="mb-3" key={key}>
                <label
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "#4A5B7A",
                    marginBottom: 5,
                    display: "block",
                  }}
                >
                  {label}
                </label>
                <input
                  type={type}
                  value={formData[key]}
                  onChange={(e) =>
                    setFormData({ ...formData, [key]: e.target.value })
                  }
                  required
                  placeholder={placeholder}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid #D0DAEE",
                    borderRadius: 10,
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "border 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2952A3")}
                  onBlur={(e) => (e.target.style.borderColor = "#D0DAEE")}
                />
              </div>
            ))}

            <div className="mb-4">
              <label
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "#4A5B7A",
                  marginBottom: 5,
                  display: "block",
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  placeholder="Create a strong password"
                  style={{
                    width: "100%",
                    padding: "10px 40px 10px 14px",
                    border: "1.5px solid #D0DAEE",
                    borderRadius: 10,
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "border 0.2s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#2952A3")}
                  onBlur={(e) => (e.target.style.borderColor = "#D0DAEE")}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#bbb",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {showPass ? <FaEyeSlash size={15} /> : <FaEye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: loading ? "#8BA7D4" : "#2952A3",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: "0.95rem",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.2s",
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p
            style={{
              textAlign: "center",
              marginTop: 20,
              fontSize: "0.88rem",
              color: "#8A9BBC",
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "#2952A3",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
