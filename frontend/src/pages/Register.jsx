import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, setTokens, setStoredUser, isAuthenticated } from "../api.js";

function BriefcaseIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="14" rx="3" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <span style={styles.checkIcon} aria-hidden="true">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
        strokeLinejoin="round">
        <path d="m5 12 4 4L19 6" />
      </svg>
    </span>
  );
}

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  async function handleRegister(event) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          username: username.trim(),
          password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.username) {
          throw new Error(Array.isArray(data.username) ? data.username[0] : data.username);
        }
        if (data.email) {
          throw new Error(Array.isArray(data.email) ? data.email[0] : data.email);
        }
        if (data.password) {
          throw new Error(Array.isArray(data.password) ? data.password[0] : data.password);
        }
        if (data.confirm_password) {
          throw new Error(Array.isArray(data.confirm_password) ? data.confirm_password[0] : data.confirm_password);
        }
        throw new Error(data.detail || "Unable to complete registration.");
      }

      // Auto login with generated tokens
      if (data.access) {
        setTokens(data.access, data.refresh);
        if (data.user) {
          setStoredUser(data.user);
        }
        navigate("/dashboard");
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Cannot connect to the server. Make sure Django is running on port 8000."
          : err.message || "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.glowOne} />
      <div style={styles.glowTwo} />

      <header style={styles.topbar}>
        <Link to="/" style={styles.brand}>
          <span style={styles.brandIcon}><BriefcaseIcon /></span>
          <span>JobTrack<span style={styles.brandDot}>.</span></span>
        </Link>
        <span style={styles.topNote}>
          CREATE YOUR ACCOUNT
        </span>
      </header>

      <section style={styles.layout}>
        <div style={styles.hero}>
          <div style={styles.eyebrow}>
            <span style={styles.liveDot} />
            MULTI-USER SAAS WORKSPACE
          </div>

          <h1 style={styles.heroTitle}>
            Start your job
            <br />
            search on a
            <br />
            <span style={styles.gradientText}>winning foundation.</span>
          </h1>

          <p style={styles.heroDescription}>
            Every candidate gets a personal, isolated workspace. Manage your applications,
            prepare for upcoming interview rounds, track metrics, and export data anytime.
          </p>

          <div style={styles.benefits}>
            <div style={styles.benefit}>
              <CheckIcon />
              <span>100% private, isolated candidate workspace</span>
            </div>
            <div style={styles.benefit}>
              <CheckIcon />
              <span>Interactive Kanban pipeline & interview tracking</span>
            </div>
            <div style={styles.benefit}>
              <CheckIcon />
              <span>Real-time metrics, conversion analytics & CSV export</span>
            </div>
          </div>
        </div>

        <div style={styles.formSide}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>
              <BriefcaseIcon />
            </div>

            <div style={styles.welcomeTag}>GET STARTED FREE</div>
            <h2 style={styles.cardTitle}>Create your account</h2>
            <p style={styles.cardDescription}>
              Join JobTrack today to manage your full career pipeline.
            </p>

            <form onSubmit={handleRegister}>
              <label htmlFor="reg-fullname" style={styles.label}>
                Full Name
              </label>
              <input
                id="reg-fullname"
                type="text"
                autoComplete="name"
                placeholder="e.g. Alex Morgan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={styles.input}
              />

              <label htmlFor="reg-email" style={styles.label}>
                Work or Personal Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="alex@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />

              <label htmlFor="reg-username" style={styles.label}>
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username (min 3 chars)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                style={styles.input}
              />

              <div style={styles.passwordHeading}>
                <label htmlFor="reg-password" style={styles.label}>
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={styles.showButtonInline}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <input
                id="reg-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />

              <label htmlFor="reg-confirm" style={styles.label}>
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={styles.input}
              />

              {error && (
                <div role="alert" style={styles.errorBox}>
                  <span aria-hidden="true">!</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitButton,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? "wait" : "pointer",
                }}
              >
                {loading ? "Creating your account..." : "Create Account & Get Started"}
                {!loading && <span style={styles.buttonArrow}>→</span>}
              </button>
            </form>

            <div style={styles.cardFooter}>
              <span>Already have an account? </span>
              <Link to="/login" style={styles.switchLink}>
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer style={styles.bottomBar}>
        <span>© 2026 JobTrack. All rights reserved.</span>
        <span>Secure multi-user career architecture.</span>
      </footer>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    position: "relative",
    overflow: "hidden",
    boxSizing: "border-box",
    padding: "0 6%",
    background: "#0b1020",
    color: "#f8fafc",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, sans-serif",
    display: "flex",
    flexDirection: "column",
  },
  glowOne: {
    position: "absolute",
    width: "430px",
    height: "430px",
    borderRadius: "50%",
    background: "#6546e8",
    filter: "blur(150px)",
    opacity: 0.17,
    top: "80px",
    left: "-180px",
    pointerEvents: "none",
  },
  glowTwo: {
    position: "absolute",
    width: "400px",
    height: "400px",
    borderRadius: "50%",
    background: "#2563eb",
    filter: "blur(150px)",
    opacity: 0.14,
    bottom: "0",
    right: "-120px",
    pointerEvents: "none",
  },
  topbar: {
    minHeight: "82px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    borderBottom: "1px solid #ffffff12",
    position: "relative",
    zIndex: 1,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#ffffff",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: "23px",
    letterSpacing: "-0.8px",
  },
  brandIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "13px",
    background: "linear-gradient(135deg, #8b5cf6, #5b5ce2)",
    display: "grid",
    placeItems: "center",
    color: "#fff",
    boxShadow: "0 7px 25px #7655ec40",
  },
  brandDot: { color: "#a78bfa" },
  topNote: {
    color: "#9ba7c0",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "2px",
  },
  layout: {
    flex: 1,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.9fr)",
    alignItems: "center",
    gap: "clamp(35px, 6vw, 90px)",
    padding: "40px 0",
    position: "relative",
    zIndex: 1,
  },
  hero: { maxWidth: "560px" },
  eyebrow: {
    display: "inline-flex",
    alignItems: "center",
    gap: "9px",
    border: "1px solid #a78bfa35",
    background: "#8b5cf610",
    color: "#c4b5fd",
    borderRadius: "100px",
    padding: "10px 14px",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "1.5px",
    marginBottom: "24px",
  },
  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#a78bfa",
    boxShadow: "0 0 12px #a78bfa",
  },
  heroTitle: {
    fontSize: "clamp(36px, 4.5vw, 62px)",
    lineHeight: 1.12,
    letterSpacing: "-2.4px",
    fontWeight: 800,
    margin: "0 0 20px",
  },
  gradientText: {
    background: "linear-gradient(90deg, #a78bfa, #7dd3fc)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  },
  heroDescription: {
    color: "#a5b0c6",
    fontSize: "15px",
    lineHeight: 1.8,
    maxWidth: "460px",
    margin: "0 0 28px",
  },
  benefits: { display: "grid", gap: "14px" },
  benefit: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#d7deec",
    fontSize: "13px",
  },
  checkIcon: {
    display: "inline-grid",
    placeItems: "center",
    flexShrink: 0,
    width: "25px",
    height: "25px",
    borderRadius: "50%",
    color: "#a78bfa",
    background: "#a78bfa18",
    border: "1px solid #a78bfa25",
  },
  formSide: { width: "100%", maxWidth: "460px", justifySelf: "end" },
  card: {
    boxSizing: "border-box",
    width: "100%",
    padding: "32px 30px",
    borderRadius: "24px",
    background: "linear-gradient(145deg, #ffffff, #f8f9ff)",
    color: "#171b2e",
    boxShadow: "0 30px 100px #00000050",
    border: "1px solid #ffffff80",
  },
  cardIcon: {
    width: "44px",
    height: "44px",
    display: "grid",
    placeItems: "center",
    borderRadius: "13px",
    background: "#eee9ff",
    color: "#6d4be5",
    marginBottom: "18px",
  },
  welcomeTag: {
    fontSize: "10px",
    letterSpacing: "2px",
    fontWeight: 800,
    color: "#7658d8",
    marginBottom: "8px",
  },
  cardTitle: {
    fontSize: "26px",
    letterSpacing: "-0.8px",
    lineHeight: 1.25,
    margin: "0 0 8px",
    fontWeight: 800,
  },
  cardDescription: {
    fontSize: "13px",
    color: "#73798d",
    lineHeight: 1.6,
    margin: "0 0 22px",
  },
  label: {
    display: "block",
    color: "#30354b",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "6px",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    height: "45px",
    padding: "0 13px",
    marginBottom: "16px",
    border: "1px solid #e1e4ee",
    borderRadius: "9px",
    outlineColor: "#8b72ef",
    background: "#fff",
    color: "#171b2e",
    fontSize: "13px",
  },
  passwordHeading: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  showButtonInline: {
    border: "none",
    background: "transparent",
    color: "#6d55c8",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "2px 4px",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "10px 12px",
    marginBottom: "14px",
    borderRadius: "8px",
    background: "#fff0f0",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "12px",
    lineHeight: 1.4,
  },
  submitButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    width: "100%",
    minHeight: "48px",
    border: "none",
    borderRadius: "10px",
    background: "linear-gradient(100deg, #7355e8, #5945d5)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 750,
    boxShadow: "0 8px 20px #6c55dc35",
  },
  buttonArrow: { fontSize: "18px", lineHeight: 1 },
  cardFooter: {
    borderTop: "1px solid #e9eaf2",
    marginTop: "20px",
    paddingTop: "16px",
    textAlign: "center",
    fontSize: "13px",
    color: "#6e758a",
  },
  switchLink: {
    color: "#6550c8",
    textDecoration: "none",
    fontWeight: 700,
  },
  bottomBar: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    padding: "18px 0",
    borderTop: "1px solid #ffffff12",
    color: "#7f8ba5",
    fontSize: "10px",
  },
};

