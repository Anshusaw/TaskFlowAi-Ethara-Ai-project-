const pool = require('./db');
const bcrypt = require('bcryptjs');

const SEED_CHECK = 'admin@taskflow.com';

async function runSeed() {
  try {
    // ── Check if already seeded ──────────────────────────────
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [SEED_CHECK]
    );
    if (existing.length > 0) {
      console.log('✅ Database already seeded — skipping.');
      return;
    }

    console.log('🌱 Seeding database with demo data...');

    // ── Hash password at runtime (guaranteed to work) ────────
    const password = await bcrypt.hash('Password@123', 12);

    // ── USERS ────────────────────────────────────────────────
    await pool.query(
      `INSERT INTO users (name, email, password, role, avatar_color) VALUES
      (?, 'admin@taskflow.com', ?, 'admin',  '#7c6df0'),
      (?, 'priya@taskflow.com', ?, 'member', '#8b5cf6'),
      (?, 'rahul@taskflow.com', ?, 'member', '#06b6d4'),
      (?, 'sneha@taskflow.com', ?, 'member', '#10b981'),
      (?, 'arjun@taskflow.com', ?, 'member', '#f59e0b'),
      (?, 'kavya@taskflow.com', ?, 'member', '#ef4444'),
      (?, 'dev@taskflow.com',   ?, 'member', '#ec4899'),
      (?, 'tanya@taskflow.com', ?, 'member', '#3b82f6')`,
      [
        'Anshuman Raj',  password,
        'Priya Sharma',  password,
        'Rahul Verma',   password,
        'Sneha Patel',   password,
        'Arjun Mehta',   password,
        'Kavya Nair',    password,
        'Dev Khanna',    password,
        'Tanya Singh',   password,
      ]
    );
    console.log('  ✓ Users inserted (all passwords: Password@123)');

    // ── PROJECTS ─────────────────────────────────────────────
    await pool.query(`
      INSERT INTO projects (name, description, owner_id, status, deadline) VALUES
      ('E-Commerce Revamp',      'Complete redesign of the shopping platform with AI recommendations and new checkout flow.',         1, 'active',    '2026-06-30'),
      ('Mobile App v2.0',        'Native iOS & Android app with real-time notifications, offline mode, and biometric auth.',         1, 'active',    '2026-07-15'),
      ('AI Analytics Dashboard', 'Build an internal data insights platform with ML-powered forecasting and live KPI widgets.',       2, 'active',    '2026-06-10'),
      ('DevOps Migration',       'Migrate all services from bare-metal to Kubernetes on AWS EKS with full CI/CD pipeline.',          1, 'active',    '2026-05-20'),
      ('Brand Identity 2026',    'New visual identity system: logo, design tokens, component library, and brand guidelines doc.',    3, 'completed', '2026-03-31'),
      ('Security Audit Q2',      'Comprehensive penetration testing, dependency scanning, and OWASP compliance review.',             1, 'active',    '2026-05-31')
    `);
    console.log('  ✓ Projects inserted');

    // ── PROJECT MEMBERS ──────────────────────────────────────
    await pool.query(`
      INSERT INTO project_members (project_id, user_id) VALUES
      (1,1),(1,2),(1,3),(1,4),(1,5),
      (2,1),(2,3),(2,6),(2,7),(2,8),
      (3,2),(3,1),(3,4),(3,5),
      (4,1),(4,3),(4,7),
      (5,3),(5,2),(5,8),
      (6,1),(6,5),(6,6)
    `);
    console.log('  ✓ Project members inserted');

    // ── TASKS — Project 1: E-Commerce Revamp ────────────────
    await pool.query(`
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date, ai_suggested_priority) VALUES
      ('Redesign homepage hero section',           'New hero with animated product showcase and CTA. Match new brand tokens.',            1, 2, 1, 'done',        'high',     '2026-04-10', 'high'),
      ('Implement product search with Algolia',    'Replace legacy search with Algolia instant search, filters, and typo tolerance.',    1, 3, 1, 'done',        'critical', '2026-04-15', 'critical'),
      ('Build cart and checkout flow v3',          'Multi-step checkout: cart > address > payment > confirmation. Mobile first.',        1, 4, 1, 'in_progress', 'critical', '2026-05-20', 'critical'),
      ('Integrate Razorpay payment gateway',       'Add Razorpay UPI, card, netbanking. Handle webhooks for order status.',              1, 3, 1, 'in_progress', 'critical', '2026-05-25', 'critical'),
      ('Product recommendation engine',           'Collaborative filtering model. Show You may also like on PDP and cart.',             1, 5, 2, 'todo',        'high',     '2026-06-05', 'high'),
      ('Write product page SEO meta tags',        'Dynamic OG tags, structured data JSON-LD, canonical URLs for all PDPs.',            1, 2, 1, 'review',      'medium',   '2026-05-10', 'medium'),
      ('Mobile responsive audit',                 'Test all pages on iOS/Android. Fix overflow, tap target, and font scaling issues.',  1, 4, 1, 'review',      'high',     '2026-05-12', 'high'),
      ('Set up image CDN with Cloudflare',        'Migrate product images to Cloudflare Images. Add WebP conversion and lazy load.',    1, 3, 1, 'done',        'medium',   '2026-04-20', 'medium'),
      ('Customer review and ratings system',      'Star ratings, text reviews, verified purchase badge, helpful votes.',                1, 5, 2, 'todo',        'medium',   '2026-06-15', 'medium'),
      ('Wishlist and save-for-later feature',     'Persistent wishlist tied to account. Share wishlist via link.',                      1, 2, 1, 'todo',        'low',      '2026-06-20', 'low'),
      ('Order tracking page',                     'Real-time order status with map view. Integrate Delhivery API.',                    1, 4, 1, 'in_progress', 'high',     '2026-05-28', 'high'),
      ('Admin product bulk upload CSV',           'Allow merchants to upload 1000+ products via CSV with validation errors.',           1, 3, 1, 'todo',        'medium',   '2026-06-10', 'medium'),
      ('Performance Core Web Vitals',             'Get LCP < 2.5s, CLS < 0.1, FID < 100ms. Use Lighthouse CI in pipeline.',           1, 5, 1, 'in_progress', 'high',     '2026-05-15', 'critical'),
      ('A/B test sticky vs fixed add-to-cart',    'Run Optimizely experiment on ATC button position. 2-week test.',                    1, 2, 2, 'todo',        'low',      '2026-06-25', 'low'),
      ('Email templates for order lifecycle',     'Transactional emails: confirm, shipped, delivered, return. Use Postmark.',          1, 4, 1, 'review',      'medium',   '2026-05-08', 'medium'),
      ('Write unit tests for cart logic',         'Jest tests for add, remove, update qty, apply coupon, price calculation.',          1, 3, 1, 'todo',        'high',     '2026-06-01', 'high'),
      ('Coupon and discount management',          'Admin UI to create percent and flat discounts, usage limits, expiry dates.',        1, 5, 1, 'todo',        'medium',   '2026-06-12', 'medium'),
      ('Cookie consent and GDPR compliance',      'Implement consent banner, preference centre, and data deletion request flow.',      1, 2, 1, 'done',        'high',     '2026-04-25', 'high'),
      ('Product variant management size/color',   'Handle SKU matrix: colour x size. Inventory per variant. Dynamic price.',          1, 4, 2, 'in_progress', 'critical', '2026-05-22', 'critical'),
      ('Integrate Google Analytics 4',            'Replace UA with GA4. Set up conversion events, funnels, and custom dimensions.',   1, 3, 1, 'done',        'medium',   '2026-04-18', 'medium')
    `);
    console.log('  ✓ E-Commerce tasks inserted (20)');

    // ── TASKS — Project 2: Mobile App v2.0 ──────────────────
    await pool.query(`
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date, ai_suggested_priority) VALUES
      ('Set up React Native monorepo',          'Turborepo with shared packages for ios/android/web. Yarn workspaces.',              2, 3, 1, 'done',        'critical', '2026-04-05', 'critical'),
      ('Implement biometric authentication',    'FaceID / Fingerprint login using expo-local-authentication. Fallback to PIN.',     2, 6, 1, 'done',        'high',     '2026-04-20', 'high'),
      ('Push notifications FCM and APNs',       'Real-time notifications for task assignments, comments, deadline reminders.',       2, 7, 1, 'in_progress', 'critical', '2026-05-15', 'critical'),
      ('Offline mode with SQLite sync',         'Cache tasks/projects locally. Sync on reconnect. Conflict resolution strategy.',   2, 3, 1, 'in_progress', 'high',     '2026-05-30', 'high'),
      ('Dark mode support',                     'System-aware dark/light theming using React Navigation + styled-components.',       2, 8, 1, 'done',        'medium',   '2026-04-28', 'medium'),
      ('App onboarding flow 5 screens',         'Carousel walkthrough with lottie animations. Skip option. Once-per-install.',      2, 6, 3, 'review',      'medium',   '2026-05-05', 'medium'),
      ('Deep linking and universal links',      'Handle app:// scheme and https:// universal links. Route to correct screen.',      2, 7, 1, 'todo',        'high',     '2026-06-01', 'high'),
      ('Submit to App Store and Play Store',    'Prepare screenshots, descriptions, age ratings. Submit for review.',               2, 3, 1, 'todo',        'critical', '2026-07-01', 'critical'),
      ('Performance profiling and memory leaks','Use Flipper + Hermes profiler. Fix 3 identified memory leaks in FlatList.',        2, 8, 1, 'in_progress', 'high',     '2026-06-10', 'high'),
      ('Crash reporting with Sentry',           'Integrate Sentry RN SDK. Set up alerts for crash-free session rate < 99.5%.',     2, 7, 1, 'done',        'high',     '2026-04-22', 'high'),
      ('Accessibility audit WCAG 2.1 AA',       'Screen reader support, touch targets 44pt min, colour contrast ratios.',          2, 6, 1, 'todo',        'medium',   '2026-06-20', 'medium'),
      ('In-app update prompts',                 'Force-update for breaking changes. Soft-update nudge for minor releases.',         2, 3, 1, 'todo',        'low',      '2026-06-25', 'low'),
      ('Widget for iOS home screen',            'Show 3 upcoming tasks in iOS 16+ small/medium widget via WidgetKit.',              2, 8, 1, 'todo',        'low',      '2026-07-10', 'low'),
      ('CI/CD with Expo EAS Build',             'Automate builds and OTA updates on PR merge. TestFlight + internal track.',        2, 7, 1, 'in_progress', 'high',     '2026-05-20', 'high'),
      ('Write E2E tests with Detox',            'Cover login, create task, mark done, logout flows on both platforms.',             2, 3, 1, 'todo',        'high',     '2026-06-15', 'high')
    `);
    console.log('  ✓ Mobile App tasks inserted (15)');

    // ── TASKS — Project 3: AI Analytics Dashboard ────────────
    await pool.query(`
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date, ai_suggested_priority) VALUES
      ('Data pipeline Kafka to ClickHouse',     'Stream events from Kafka topics into ClickHouse. Lag < 5 seconds.',                3, 4, 2, 'done',        'critical', '2026-04-12', 'critical'),
      ('KPI widget library 10 widgets',         'Reusable chart components: line, bar, pie, heatmap, funnel, gauge, scatter.',      3, 5, 2, 'in_progress', 'high',     '2026-05-18', 'high'),
      ('ML forecasting revenue prediction',     '30-day revenue forecast using Prophet. Show confidence bands on chart.',           3, 2, 2, 'in_progress', 'critical', '2026-05-25', 'critical'),
      ('User cohort analysis feature',          'Cohort retention table. Filter by signup date, plan type, region.',                3, 4, 2, 'todo',        'high',     '2026-06-05', 'high'),
      ('Role-based dashboard access',           'Viewer / Analyst / Editor roles. Restrict raw data export to Analysts+.',         3, 5, 2, 'review',      'high',     '2026-05-10', 'high'),
      ('CSV and PDF export for reports',        'Export any widget data as CSV. Full dashboard snapshot as branded PDF.',          3, 2, 2, 'todo',        'medium',   '2026-06-10', 'medium'),
      ('Anomaly detection alerts',              'Z-score based anomaly detection. Slack + email alert when metric spikes.',        3, 4, 2, 'todo',        'high',     '2026-06-08', 'high'),
      ('Dashboard sharing via public link',     'Generate shareable read-only link with optional password and expiry.',             3, 5, 2, 'todo',        'medium',   '2026-06-20', 'medium'),
      ('Natural language query NLQ feature',    'Type show me revenue last 30 days and auto-generate SQL then render chart.',      3, 2, 2, 'todo',        'critical', '2026-07-01', 'critical'),
      ('Write API documentation Swagger',       'Document all 40+ endpoints with request/response schemas and auth examples.',     3, 4, 2, 'review',      'medium',   '2026-05-15', 'medium'),
      ('Load test 500 concurrent users',        'k6 load test. Ensure p95 latency < 300ms at 500 RPS. Fix bottlenecks.',          3, 5, 2, 'in_progress', 'high',     '2026-05-28', 'high'),
      ('Dark and light theme toggle',           'Persist theme preference per user in their profile settings.',                    3, 2, 2, 'done',        'low',      '2026-04-30', 'low')
    `);
    console.log('  ✓ AI Analytics tasks inserted (12)');

    // ── TASKS — Project 4: DevOps Migration ─────────────────
    await pool.query(`
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date, ai_suggested_priority) VALUES
      ('Containerise all 12 services',         'Write production-grade Dockerfiles. Multi-stage builds. Non-root users.',          4, 3, 1, 'done',        'critical', '2026-04-08', 'critical'),
      ('Write Kubernetes manifests',            'Deployments, Services, ConfigMaps, Secrets, HPA for all services.',               4, 7, 1, 'done',        'critical', '2026-04-18', 'critical'),
      ('Set up AWS EKS cluster',                'EKS 1.29, managed node groups, VPC CNI, IRSA for pod-level IAM.',                 4, 3, 1, 'done',        'critical', '2026-04-22', 'critical'),
      ('Configure Helm charts',                 'Package each service as a Helm chart. Separate values for dev/staging/prod.',     4, 7, 1, 'in_progress', 'high',     '2026-05-10', 'high'),
      ('GitOps with ArgoCD',                    'ArgoCD manages prod deployments. PR merge auto sync. Drift detection.',           4, 3, 1, 'in_progress', 'high',     '2026-05-15', 'high'),
      ('Set up Prometheus and Grafana',         'Scrape all pods. Create dashboards for CPU, memory, request rate, error rate.',   4, 7, 1, 'todo',        'high',     '2026-05-18', 'high'),
      ('Centralised logging with ELK stack',   'Filebeat to Logstash to Elasticsearch to Kibana. Retain 30 days.',                4, 3, 1, 'todo',        'medium',   '2026-05-20', 'medium'),
      ('Blue-green deployment strategy',       'Zero-downtime deploys via weighted target groups in ALB.',                         4, 7, 1, 'todo',        'high',     '2026-05-19', 'critical'),
      ('Disaster recovery runbook',            'RTO < 1h, RPO < 15min. Document failover procedure. Quarterly DR drills.',        4, 3, 1, 'todo',        'critical', '2026-05-19', 'critical'),
      ('Cost optimisation Spot instances',     'Move non-critical workloads to Spot. Estimated 40% compute cost saving.',         4, 7, 1, 'todo',        'medium',   '2026-05-20', 'medium')
    `);
    console.log('  ✓ DevOps tasks inserted (10)');

    // ── TASKS — Project 6: Security Audit Q2 ────────────────
    await pool.query(`
      INSERT INTO tasks (title, description, project_id, assigned_to, created_by, status, priority, due_date, ai_suggested_priority) VALUES
      ('OWASP Top 10 vulnerability scan',      'Run ZAP + Burp Suite against staging. Document and triage all findings.',          6, 5, 1, 'done',        'critical', '2026-05-05', 'critical'),
      ('Dependency audit npm and pip',         'Snyk scan all repos. Patch all HIGH/CRITICAL CVEs within 7 days.',                6, 6, 1, 'in_progress', 'critical', '2026-05-15', 'critical'),
      ('Penetration test API endpoints',       'Manual pentest for auth bypass, SQLi, IDOR on all 40+ API routes.',               6, 5, 1, 'in_progress', 'critical', '2026-05-20', 'critical'),
      ('Enable WAF on Cloudflare',             'Configure WAF rules for XSS, SQLi, bad bots. Enable rate limiting.',              6, 6, 1, 'todo',        'high',     '2026-05-22', 'high'),
      ('Secrets rotation procedure',           'Rotate all DB passwords, API keys, JWT secrets. Document rotation schedule.',     6, 5, 1, 'todo',        'critical', '2026-05-25', 'critical'),
      ('Multi-factor authentication MFA',      'TOTP-based MFA for all admin accounts. FIDO2/WebAuthn for high-privilege ops.',   6, 6, 1, 'todo',        'high',     '2026-05-28', 'high'),
      ('Security headers audit',               'Enforce HSTS, CSP, X-Frame-Options, CORP. Use securityheaders.com to verify.',   6, 5, 1, 'review',      'medium',   '2026-05-12', 'medium'),
      ('Write incident response playbook',     'Define P0/P1/P2 severity. On-call escalation tree. Communication templates.',     6, 6, 1, 'todo',        'high',     '2026-05-30', 'high')
    `);
    console.log('  ✓ Security Audit tasks inserted (8)');

    // ── COMMENTS ─────────────────────────────────────────────
    await pool.query(`
      INSERT INTO comments (task_id, user_id, content) VALUES
      (3,  1, 'Cart flow designs approved by stakeholders. Rahul please start on the payment integration in parallel.'),
      (3,  4, 'Started on the address form. Will use Google Places API for autocomplete. ETA 3 days.'),
      (3,  3, 'Razorpay sandbox is set up. Webhook endpoint is ready at /api/payments/webhook.'),
      (13, 5, 'LCP is currently at 4.1s. Main culprit is the unoptimised hero image. Switching to next/image fixes it.'),
      (13, 1, 'Good catch. Also make sure we defer non-critical JS. Target < 2.5s before the June release.'),
      (23, 4, 'Kafka consumer group is running. Average lag is 2.3 seconds. Well within the 5s SLA.'),
      (35, 7, 'Helm charts for auth-service and api-gateway are done. Working on the worker services next.'),
      (57, 5, 'ZAP found 3 HIGH severity issues: missing CSRF token, open redirect on login, and reflected XSS on search param.'),
      (57, 1, 'Prioritise the CSRF fix that goes to production tonight. Open redirect and XSS by end of week.'),
      (58, 6, 'Snyk found 12 critical CVEs in the dependencies. Most are in old lodash and axios versions. Updating now.')
    `);
    console.log('  ✓ Comments inserted');

    console.log('🎉 Database seeded! 8 users, 6 projects, 65 tasks — all ready.');
    console.log('   👤 Admin login  → admin@taskflow.com  / Password@123');
    console.log('   👤 Member login → priya@taskflow.com  / Password@123');

  } catch (err) {
    console.error('❌ Seeder error:', err.message);
  }
}

module.exports = runSeed;
