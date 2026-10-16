
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL, setTokens, isAuthenticated } from "../api.js";

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

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/token/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Incorrect username or password. Please try again."
            : data.detail || "Unable to sign in. Please try again."
        );
      }

      if (!data.access) {
        throw new Error("The server did not return an access token.");
      }

      setTokens(data.access, data.refresh);
      navigate("/dashboard");
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
        <Link to="/login" style={styles.brand}>
          <span style={styles.brandIcon}><BriefcaseIcon /></span>
          <span>JobTrack<span style={styles.brandDot}>.</span></span>
        </Link>
        <span style={styles.topNote}>
          YOUR CAREER, ORGANIZED
        </span>
      </header>

      <section style={styles.layout}>
        <div style={styles.hero}>
          <div style={styles.eyebrow}>
            <span style={styles.liveDot} />
            YOUR NEXT CHAPTER STARTS HERE
          </div>

          <h1 style={styles.heroTitle}>
            Your next big
            <br />
            opportunity
            <br />
            <span style={styles.gradientText}>starts with you.</span>
          </h1>

          <p style={styles.heroDescription}>
            Keep every application organized, every interview on track,
            and every career goal within reach.
          </p>

          <div style={styles.benefits}>
            <div style={styles.benefit}>
              <CheckIcon />
              <span>All your applications in one place</span>
            </div>
            <div style={styles.benefit}>
              <CheckIcon />
              <span>Stay ready for every interview</span>
            </div>
            <div style={styles.benefit}>
              <CheckIcon />
              <span>Track your progress with clarity</span>
            </div>
          </div>

          <div style={styles.quoteCard}>
            <div style={styles.quoteMark}>“</div>
            <div>
              <p style={styles.quote}>
                Small steps every day lead to big career milestones.
              </p>
              <span style={styles.quoteCaption}>YOUR CAREER JOURNEY</span>
            </div>
          </div>
        </div>

        <div style={styles.formSide}>
          <div style={styles.card}>
            <div style={styles.cardIcon}>
              <BriefcaseIcon />
            </div>

            <div style={styles.welcomeTag}>WELCOME BACK</div>
            <h2 style={styles.cardTitle}>Sign in to JobTrack</h2>
            <p style={styles.cardDescription}>
              Pick up where your career journey left off.
            </p>

            <form onSubmit={handleLogin}>
              <label htmlFor="username" style={styles.label}>
                Username
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                style={styles.input}
              />

              <div style={styles.passwordHeading}>
                <label htmlFor="password" style={styles.label}>
                  Password
                </label>
              </div>

              <div style={styles.passwordWrap}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  style={styles.passwordInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  style={styles.showButton}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

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
                {loading ? "Signing you in..." : "Sign in to your account"}
                {!loading && <span style={styles.buttonArrow}>→</span>}
              </button>
            </form>

            <div style={styles.secureNote}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                strokeLinejoin="round" aria-hidden="true">
                <rect x="4" y="10" width="16" height="11" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              Secure authentication powered by Django
            </div>

            <div style={styles.cardFooter}>
              <div style={{ marginBottom: "12px", fontSize: "13px", color: "#6e758a" }}>
                <span>Don&apos;t have an account? </span>
                <Link to="/register" style={styles.backLink}>
                  Sign up free
                </Link>
              </div>
              <Link to="/" style={{ ...styles.backLink, fontSize: "11px", color: "#8a91a5" }}>
                ← Explore Landing Page
              </Link>
            </div>
          </div>

          <p style={styles.footerNote}>
            FOCUS ON YOUR FUTURE. WE'LL HELP YOU STAY ORGANIZED.
          </p>
        </div>
      </section>

      <footer style={styles.bottomBar}>
        <span>© 2026 JobTrack</span>
        <span>Built for your next opportunity.</span>
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
    gridTemplateColumns: "minmax(0, 1.1fr) minmax(340px, 0.9fr)",
    alignItems: "center",
    gap: "clamp(35px, 7vw, 100px)",
    padding: "54px 0",
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
    marginBottom: "28px",
  },
  liveDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#a78bfa",
    boxShadow: "0 0 12px #a78bfa",
  },
  heroTitle: {
    fontSize: "clamp(39px, 5vw, 67px)",
    lineHeight: 1.1,
    letterSpacing: "-2.8px",
    fontWeight: 800,
    margin: "0 0 22px",
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
    lineHeight: 1.9,
    maxWidth: "440px",
    margin: "0 0 30px",
  },
  benefits: { display: "grid", gap: "16px" },
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
  quoteCard: {
    display: "flex",
    gap: "13px",
    alignItems: "flex-start",
    padding: "19px 20px",
    marginTop: "38px",
    borderRadius: "15px",
    border: "1px solid #ffffff12",
    background: "#ffffff06",
    maxWidth: "400px",
  },
  quoteMark: {
    color: "#a78bfa",
    fontSize: "39px",
    lineHeight: 0.9,
    fontFamily: "Georgia, serif",
  },
  quote: {
    margin: "0 0 9px",
    color: "#e2e8f0",
    fontSize: "13px",
    lineHeight: 1.7,
  },
  quoteCaption: {
    fontSize: "9px",
    letterSpacing: "1.7px",
    fontWeight: 800,
    color: "#8793ad",
  },
  formSide: { width: "100%", maxWidth: "440px", justifySelf: "end" },
  card: {
    boxSizing: "border-box",
    width: "100%",
    padding: "clamp(25px, 4vw, 40px)",
    borderRadius: "24px",
    background: "linear-gradient(145deg, #ffffff, #f8f9ff)",
    color: "#171b2e",
    boxShadow: "0 30px 100px #00000050",
    border: "1px solid #ffffff80",
  },
  cardIcon: {
    width: "47px",
    height: "47px",
    display: "grid",
    placeItems: "center",
    borderRadius: "15px",
    background: "#eee9ff",
    color: "#6d4be5",
    marginBottom: "24px",
  },
  welcomeTag: {
    fontSize: "10px",
    letterSpacing: "2px",
    fontWeight: 800,
    color: "#7658d8",
    marginBottom: "9px",
  },
  cardTitle: {
    fontSize: "28px",
    letterSpacing: "-0.9px",
    lineHeight: 1.25,
    margin: "0 0 10px",
    fontWeight: 800,
  },
  cardDescription: {
    fontSize: "13px",
    color: "#73798d",
    lineHeight: 1.7,
    margin: "0 0 29px",
  },
  label: {
    display: "block",
    color: "#30354b",
    fontSize: "12px",
    fontWeight: 700,
    marginBottom: "9px",
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    height: "49px",
    padding: "0 14px",
    marginBottom: "21px",
    border: "1px solid #e1e4ee",
    borderRadius: "10px",
    outlineColor: "#8b72ef",
    background: "#fff",
    color: "#171b2e",
    fontSize: "13px",
  },
  passwordHeading: { display: "flex", justifyContent: "space-between" },
  passwordWrap: {
    display: "flex",
    alignItems: "center",
    height: "49px",
    border: "1px solid #e1e4ee",
    borderRadius: "10px",
    background: "#fff",
    marginBottom: "21px",
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    height: "100%",
    padding: "0 14px",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#171b2e",
    fontSize: "13px",
  },
  showButton: {
    border: "none",
    background: "transparent",
    color: "#6d55c8",
    fontSize: "11px",
    fontWeight: 700,
    cursor: "pointer",
    padding: "10px 13px",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    padding: "11px 12px",
    marginBottom: "16px",
    borderRadius: "9px",
    background: "#fff0f0",
    border: "1px solid #fecaca",
    color: "#b91c1c",
    fontSize: "12px",
    lineHeight: 1.5,
  },
  submitButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    width: "100%",
    minHeight: "51px",
    border: "none",
    borderRadius: "11px",
    background: "linear-gradient(100deg, #7355e8, #5945d5)",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 750,
    boxShadow: "0 8px 20px #6c55dc35",
  },
  buttonArrow: { fontSize: "19px", lineHeight: 1 },
  secureNote: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "7px",
    marginTop: "21px",
    color: "#82889a",
    fontSize: "10px",
  },
  cardFooter: {
    borderTop: "1px solid #e9eaf2",
    marginTop: "23px",
    paddingTop: "19px",
    textAlign: "center",
  },
  backLink: {
    color: "#6550c8",
    textDecoration: "none",
    fontSize: "12px",
    fontWeight: 700,
  },
  footerNote: {
    color: "#818ca6",
    textAlign: "center",
    fontSize: "9px",
    letterSpacing: "1.3px",
    lineHeight: 1.8,
    margin: "19px 0 0",
  },
  bottomBar: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "10px",
    padding: "20px 0",
    borderTop: "1px solid #ffffff12",
    color: "#7f8ba5",
    fontSize: "10px",
  },
};
