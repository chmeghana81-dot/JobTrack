import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { isAuthenticated } from '../api.js'

function BriefcaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="7" width="18" height="14" rx="3" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m5 12 4 4L19 6" />
    </svg>
  )
}

export default function LandingPage() {
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    setAuthed(isAuthenticated())
  }, [])

  return (
    <div style={styles.landingContainer}>
      {/* Background glow effects */}
      <div style={styles.glowTopLeft} />
      <div style={styles.glowBottomRight} />

      {/* Navigation Bar */}
      <header style={styles.navHeader}>
        <div style={styles.brandWrapper}>
          <span style={styles.brandIcon}><BriefcaseIcon /></span>
          <span style={styles.brandTitle}>JobTrack<span style={styles.brandAccent}>.</span></span>
          <span style={styles.badgeSaaS}>PRO SAAS</span>
        </div>

        <nav style={styles.navActions}>
          {authed ? (
            <Link to="/dashboard" style={styles.primaryButton}>
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" style={styles.ghostButton}>
                Sign In
              </Link>
              <Link to="/register" style={styles.primaryButton}>
                Create Free Account →
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main style={styles.mainContent}>
        <section style={styles.heroSection}>
          <div style={styles.pillTag}>
            <span style={styles.liveIndicator} />
            INTELLIGENT APPLICATION MANAGEMENT & PIPELINE
          </div>

          <h1 style={styles.heroHeading}>
            Take control of your
            <br />
            <span style={styles.heroGradient}>job search journey.</span>
          </h1>

          <p style={styles.heroLead}>
            The high-performance workspace for ambitious job seekers. Track applications,
            manage interview rounds, drag-and-drop Kanban pipelines, and analyze conversion rates —
            all with strict multi-user privacy.
          </p>

          <div style={styles.heroCtaGroup}>
            <Link to={authed ? "/dashboard" : "/register"} style={styles.heroPrimaryCta}>
              {authed ? "Open Workspace" : "Get Started — It's Free"}
              <span style={{ fontSize: "18px", marginLeft: "6px" }}>→</span>
            </Link>
            <a href="#features" style={styles.heroSecondaryCta}>
              Explore Features
            </a>
          </div>

          <div style={styles.trustRow}>
            <div style={styles.trustItem}><CheckIcon /><span>Isolated User Workspaces</span></div>
            <div style={styles.trustItem}><CheckIcon /><span>Secure JWT Auth</span></div>
            <div style={styles.trustItem}><CheckIcon /><span>Real-Time CSV Export</span></div>
          </div>
        </section>

        {/* Live Product Preview Card */}
        <section style={styles.previewSection}>
          <div style={styles.previewWindow}>
            <div style={styles.windowHeader}>
              <div style={styles.windowDots}>
                <span style={{ ...styles.windowDot, background: '#ff5f56' }} />
                <span style={{ ...styles.windowDot, background: '#ffbd2e' }} />
                <span style={{ ...styles.windowDot, background: '#27c93f' }} />
              </div>
              <span style={styles.windowAddress}>jobtrack.app/dashboard</span>
              <div style={{ width: '48px' }} />
            </div>

            <div style={styles.previewContent}>
              <div style={styles.mockSidebar}>
                <div style={styles.mockSidebarBrand}>▦ JobTrack</div>
                <div style={styles.mockNavActive}>▦ Dashboard</div>
                <div style={styles.mockNav}>▤ Applications</div>
                <div style={styles.mockNav}>▣ Interviews</div>
                <div style={styles.mockNav}>▥ Analytics</div>
                <div style={styles.mockNav}>★ Saved Jobs</div>
              </div>

              <div style={styles.mockMain}>
                <div style={styles.mockTopRow}>
                  <div>
                    <h3 style={styles.mockTitle}>Candidate Workspace Overview</h3>
                    <p style={styles.mockSubtitle}>Track application stages and conversion rates</p>
                  </div>
                  <span style={styles.mockStatusLive}>● 4 Stages Active</span>
                </div>

                <div style={styles.mockMetricsGrid}>
                  <div style={styles.mockMetricCard}>
                    <span style={styles.mockMetricLabel}>Total Applications</span>
                    <strong style={styles.mockMetricValue}>24</strong>
                  </div>
                  <div style={styles.mockMetricCard}>
                    <span style={styles.mockMetricLabel}>In Progress</span>
                    <strong style={styles.mockMetricValue}>8</strong>
                  </div>
                  <div style={styles.mockMetricCard}>
                    <span style={styles.mockMetricLabel}>Interviews</span>
                    <strong style={{ ...styles.mockMetricValue, color: '#8b5cf6' }}>5</strong>
                  </div>
                  <div style={styles.mockMetricCard}>
                    <span style={styles.mockMetricLabel}>Offers</span>
                    <strong style={{ ...styles.mockMetricValue, color: '#10b981' }}>2</strong>
                  </div>
                </div>

                <div style={styles.mockKanbanPreview}>
                  <div style={styles.mockColumn}>
                    <span style={styles.mockColTitle}>Applied (10)</span>
                    <div style={styles.mockCard}>Stripe · Full Stack Dev</div>
                    <div style={styles.mockCard}>Linear · Frontend Eng</div>
                  </div>
                  <div style={styles.mockColumn}>
                    <span style={styles.mockColTitle}>Interview (5)</span>
                    <div style={{ ...styles.mockCard, borderLeft: '3px solid #8b5cf6' }}>
                      GitHub · Staff UI Dev
                    </div>
                  </div>
                  <div style={styles.mockColumn}>
                    <span style={styles.mockColTitle}>Offer (2)</span>
                    <div style={{ ...styles.mockCard, borderLeft: '3px solid #10b981' }}>
                      Vercel · Senior Engineer
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid */}
        <section id="features" style={styles.featuresSection}>
          <div style={styles.sectionHeadingWrapper}>
            <span style={styles.sectionEyebrow}>POWERFUL TOOLS FOR JOB SEEKERS</span>
            <h2 style={styles.sectionTitle}>Everything you need to land your next role</h2>
            <p style={styles.sectionDesc}>
              Stop losing opportunities in messy spreadsheets. JobTrack gives you a dedicated command center.
            </p>
          </div>

          <div style={styles.featuresGrid}>
            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>▦</div>
              <h3 style={styles.featureHeading}>Interactive Kanban Board</h3>
              <p style={styles.featureText}>
                Visualize your pipeline at every stage. Drag and drop applications from Applied to Interview,
                with instant API state synchronization.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>▣</div>
              <h3 style={styles.featureHeading}>Interview Command Center</h3>
              <p style={styles.featureText}>
                Never miss a round. Track interview dates, rounds (System Design, Coding), meeting links,
                and interview notes in one unified view.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>▥</div>
              <h3 style={styles.featureHeading}>Real-Time Analytics</h3>
              <p style={styles.featureText}>
                Know your numbers. Track conversion rates, calculate interview-to-offer percentages,
                and see where your pipeline is strongest.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>★</div>
              <h3 style={styles.featureHeading}>Saved Jobs Wishlist</h3>
              <p style={styles.featureText}>
                Bookmarking opportunities before you apply? Save listings with job links, descriptions,
                and salaries, then convert them with 1-click.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>🛡</div>
              <h3 style={styles.featureHeading}>Strict Data Isolation</h3>
              <p style={styles.featureText}>
                Multi-tenant architecture powered by Django REST Framework and JWT tokens.
                Your applications, interviews, and metrics belong solely to your account.
              </p>
            </div>

            <div style={styles.featureCard}>
              <div style={styles.featureIcon}>⇪</div>
              <h3 style={styles.featureHeading}>Instant CSV Export</h3>
              <p style={styles.featureText}>
                Need to share your tracking data or make an offline backup? Download all your application
                records as a formatted CSV spreadsheet anytime.
              </p>
            </div>
          </div>
        </section>

        {/* Step-by-Step How It Works Section */}
        <section style={styles.howItWorksSection}>
          <div style={styles.sectionHeadingWrapper}>
            <span style={styles.sectionEyebrow}>STREAMLINED CANDIDATE WORKFLOW</span>
            <h2 style={styles.sectionTitle}>How JobTrack empowers your search</h2>
            <p style={styles.sectionDesc}>
              Four straightforward steps to turn disorganized applications into interviews and offers.
            </p>
          </div>

          <div style={styles.stepsGrid}>
            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>01</div>
              <h3 style={styles.stepTitle}>Create Your Workspace</h3>
              <p style={styles.stepDesc}>
                Sign up in 30 seconds with email and password. Your personal tenant workspace is isolated immediately.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>02</div>
              <h3 style={styles.stepTitle}>Track & Organize</h3>
              <p style={styles.stepDesc}>
                Add positions, salaries, and notes. Drag cards across the Kanban board as recruiters respond.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>03</div>
              <h3 style={styles.stepTitle}>Ace Every Interview</h3>
              <p style={styles.stepDesc}>
                Log interview rounds, attach Zoom or Meet links, write prep notes, and track your scheduled dates.
              </p>
            </div>

            <div style={styles.stepCard}>
              <div style={styles.stepNumber}>04</div>
              <h3 style={styles.stepTitle}>Analyze & Convert</h3>
              <p style={styles.stepDesc}>
                Monitor conversion ratios, export backup spreadsheets, and optimize your application strategy.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section style={styles.bottomCtaSection}>
          <h2 style={styles.bottomCtaTitle}>Ready to accelerate your career?</h2>
          <p style={styles.bottomCtaSubtitle}>
            Create your account in seconds and organize your application workflow today.
          </p>
          <Link to={authed ? "/dashboard" : "/register"} style={styles.heroPrimaryCta}>
            {authed ? "Go to Dashboard" : "Create Your Free Account"} →
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerBrand}>
          <span>JobTrack.</span>
          <span style={styles.footerTagline}>Production-Ready Career Workspace</span>
        </div>
        <div style={styles.footerCopy}>
          © 2026 JobTrack · Built with React & Django REST Framework
        </div>
      </footer>
    </div>
  )
}

const styles = {
  landingContainer: {
    minHeight: '100vh',
    background: '#090d1a',
    color: '#f8fafc',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    position: 'relative',
    overflowX: 'hidden',
    boxSizing: 'border-box',
  },
  glowTopLeft: {
    position: 'absolute',
    top: '-150px',
    left: '-150px',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(108, 97, 220, 0.28) 0%, rgba(108, 97, 220, 0) 70%)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  glowBottomRight: {
    position: 'absolute',
    top: '30%',
    right: '-150px',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, rgba(37, 99, 235, 0) 70%)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  navHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 6%',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    position: 'relative',
    zIndex: 10,
  },
  brandWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  brandIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #7c6cf0, #4f46e5)',
    display: 'grid',
    placeItems: 'center',
    color: '#fff',
    boxShadow: '0 4px 18px rgba(124, 108, 240, 0.4)',
  },
  brandTitle: {
    fontSize: '22px',
    fontWeight: 800,
    letterSpacing: '-0.7px',
  },
  brandAccent: {
    color: '#8b5cf6',
  },
  badgeSaaS: {
    fontSize: '10px',
    fontWeight: 800,
    letterSpacing: '1px',
    padding: '3px 8px',
    borderRadius: '20px',
    background: 'rgba(139, 92, 246, 0.15)',
    color: '#c4b5fd',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    marginLeft: '6px',
  },
  navActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  ghostButton: {
    color: '#c4c6db',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 600,
    padding: '10px 18px',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #7c6cf0, #5c50e6)',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 700,
    padding: '10px 20px',
    borderRadius: '10px',
    boxShadow: '0 4px 18px rgba(124, 108, 240, 0.35)',
    transition: 'all 0.2s ease',
  },
  mainContent: {
    position: 'relative',
    zIndex: 2,
    padding: '0 6%',
  },
  heroSection: {
    maxWidth: '850px',
    margin: '60px auto 40px',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pillTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '100px',
    background: 'rgba(124, 108, 240, 0.12)',
    border: '1px solid rgba(124, 108, 240, 0.25)',
    color: '#c4b5fd',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '1.2px',
    marginBottom: '26px',
  },
  liveIndicator: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 10px #10b981',
  },
  heroHeading: {
    fontSize: 'clamp(40px, 6vw, 70px)',
    fontWeight: 800,
    lineHeight: 1.1,
    letterSpacing: '-2px',
    margin: '0 0 24px',
  },
  heroGradient: {
    background: 'linear-gradient(90deg, #a78bfa, #38bdf8)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  },
  heroLead: {
    fontSize: '17px',
    lineHeight: 1.7,
    color: '#94a3b8',
    maxWidth: '660px',
    margin: '0 0 36px',
  },
  heroCtaGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: '36px',
  },
  heroPrimaryCta: {
    background: 'linear-gradient(135deg, #7c6cf0, #4f46e5)',
    color: '#fff',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 700,
    padding: '14px 30px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(124, 108, 240, 0.4)',
    display: 'inline-flex',
    alignItems: 'center',
  },
  heroSecondaryCta: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    color: '#e2e8f0',
    textDecoration: 'none',
    fontSize: '16px',
    fontWeight: 600,
    padding: '14px 26px',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
  },
  trustRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: '10px',
  },
  trustItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#94a3b8',
  },
  previewSection: {
    maxWidth: '1040px',
    margin: '30px auto 90px',
  },
  previewWindow: {
    background: '#12162a',
    borderRadius: '18px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 30px 100px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 108, 240, 0.15)',
    overflow: 'hidden',
  },
  windowHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 18px',
    background: '#0d1020',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  },
  windowDots: {
    display: 'flex',
    gap: '7px',
  },
  windowDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  windowAddress: {
    fontSize: '12px',
    color: '#64748b',
    background: 'rgba(255, 255, 255, 0.04)',
    padding: '4px 18px',
    borderRadius: '6px',
    letterSpacing: '0.3px',
  },
  previewContent: {
    display: 'flex',
    minHeight: '440px',
  },
  mockSidebar: {
    width: '180px',
    background: '#17182f',
    padding: '24px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
  },
  mockSidebarBrand: {
    fontWeight: 800,
    fontSize: '16px',
    color: '#fff',
    marginBottom: '20px',
    paddingLeft: '6px',
  },
  mockNavActive: {
    padding: '10px 12px',
    borderRadius: '8px',
    background: '#343253',
    color: '#fff',
    fontSize: '13px',
    fontWeight: 600,
  },
  mockNav: {
    padding: '10px 12px',
    color: '#94a3b8',
    fontSize: '13px',
  },
  mockMain: {
    flex: 1,
    padding: '24px',
    background: '#0e1224',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  mockTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  mockTitle: {
    margin: '0 0 4px',
    fontSize: '18px',
    fontWeight: 700,
  },
  mockSubtitle: {
    margin: 0,
    fontSize: '12px',
    color: '#64748b',
  },
  mockStatusLive: {
    fontSize: '11px',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontWeight: 700,
  },
  mockMetricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  mockMetricCard: {
    background: '#161a32',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: '10px',
    padding: '14px',
  },
  mockMetricLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '4px',
  },
  mockMetricValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#fff',
  },
  mockKanbanPreview: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '14px',
    marginTop: '6px',
  },
  mockColumn: {
    background: '#14182e',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid rgba(255, 255, 255, 0.05)',
  },
  mockColTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#94a3b8',
    marginBottom: '10px',
    display: 'block',
  },
  mockCard: {
    background: '#1c213e',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#e2e8f0',
    marginBottom: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  },
  featuresSection: {
    maxWidth: '1040px',
    margin: '0 auto 100px',
  },
  sectionHeadingWrapper: {
    textAlign: 'center',
    marginBottom: '50px',
  },
  sectionEyebrow: {
    color: '#8b5cf6',
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '1.5px',
    display: 'block',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: 'clamp(28px, 4vw, 42px)',
    fontWeight: 800,
    margin: '0 0 14px',
    letterSpacing: '-1px',
  },
  sectionDesc: {
    color: '#94a3b8',
    fontSize: '15px',
    maxWidth: '540px',
    margin: '0 auto',
    lineHeight: 1.6,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
  },
  featureCard: {
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '30px',
    transition: 'transform 0.2s ease, border-color 0.2s ease',
  },
  featureIcon: {
    fontSize: '28px',
    marginBottom: '16px',
    color: '#8b5cf6',
  },
  featureHeading: {
    fontSize: '18px',
    fontWeight: 700,
    margin: '0 0 10px',
    color: '#fff',
  },
  featureText: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#94a3b8',
    margin: 0,
  },
  howItWorksSection: {
    maxWidth: '1040px',
    margin: '0 auto 100px',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  stepCard: {
    background: 'rgba(255, 255, 255, 0.025)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  stepNumber: {
    fontSize: '28px',
    fontWeight: 800,
    color: '#7c6cf0',
    marginBottom: '14px',
    fontFamily: 'monospace',
    opacity: 0.9,
  },
  stepTitle: {
    fontSize: '17px',
    fontWeight: 700,
    margin: '0 0 10px',
    color: '#fff',
  },
  stepDesc: {
    fontSize: '13px',
    lineHeight: 1.6,
    color: '#94a3b8',
    margin: 0,
  },
  bottomCtaSection: {
    maxWidth: '850px',
    margin: '0 auto 100px',
    textAlign: 'center',
    padding: '60px 30px',
    background: 'linear-gradient(135deg, rgba(124, 108, 240, 0.15), rgba(59, 130, 246, 0.1))',
    border: '1px solid rgba(124, 108, 240, 0.3)',
    borderRadius: '24px',
  },
  bottomCtaTitle: {
    fontSize: 'clamp(26px, 4vw, 36px)',
    fontWeight: 800,
    margin: '0 0 12px',
  },
  bottomCtaSubtitle: {
    color: '#94a3b8',
    fontSize: '16px',
    margin: '0 0 28px',
  },
  footer: {
    padding: '32px 6%',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '14px',
    fontSize: '13px',
    color: '#64748b',
  },
  footerBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    color: '#cbd5e1',
    fontWeight: 700,
  },
  footerTagline: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: 400,
  },
  footerCopy: {
    fontSize: '12px',
  },
}

