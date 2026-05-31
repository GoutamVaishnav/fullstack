from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    Preformatted,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "Ahoum_Sessions_Marketplace_Project_Report.pdf"


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6b7280"))
    canvas.drawString(0.72 * inch, 0.45 * inch, "Ahoum Sessions Marketplace - Project Report")
    canvas.drawRightString(A4[0] - 0.72 * inch, 0.45 * inch, f"Page {doc.page}")
    canvas.restoreState()


def styles():
    base = getSampleStyleSheet()
    base.add(
        ParagraphStyle(
            name="CoverTitle",
            parent=base["Title"],
            fontName="Helvetica-Bold",
            fontSize=26,
            leading=32,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#111827"),
            spaceAfter=14,
        )
    )
    base.add(
        ParagraphStyle(
            name="CoverSubtitle",
            parent=base["Normal"],
            fontName="Helvetica",
            fontSize=12,
            leading=18,
            alignment=TA_CENTER,
            textColor=colors.HexColor("#4b5563"),
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            name="H1Custom",
            parent=base["Heading1"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=21,
            textColor=colors.HexColor("#1f2937"),
            spaceBefore=12,
            spaceAfter=8,
        )
    )
    base.add(
        ParagraphStyle(
            name="H2Custom",
            parent=base["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#374151"),
            spaceBefore=10,
            spaceAfter=5,
        )
    )
    base.add(
        ParagraphStyle(
            name="BodyCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=9.8,
            leading=14,
            textColor=colors.HexColor("#1f2937"),
            spaceAfter=6,
        )
    )
    base.add(
        ParagraphStyle(
            name="SmallCustom",
            parent=base["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=12,
            textColor=colors.HexColor("#4b5563"),
        )
    )
    base.add(
        ParagraphStyle(
            name="CodeCustom",
            parent=base["Code"],
            fontName="Courier",
            fontSize=8,
            leading=11,
            textColor=colors.HexColor("#111827"),
            backColor=colors.HexColor("#f3f4f6"),
        )
    )
    return base


S = styles()


def p(text, style="BodyCustom"):
    return Paragraph(text, S[style])


def bullets(items):
    story = []
    for item in items:
        story.append(p(f"- {item}"))
    return story


def code(text):
    return Preformatted(text.strip(), S["CodeCustom"])


def table(rows, widths=None):
    data = [[p(str(cell), "SmallCustom") for cell in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#111827")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#d1d5db")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f9fafb")]),
            ]
        )
    )
    return t


story = []

story.append(Spacer(1, 1.35 * inch))
story.append(p("Ahoum Sessions Marketplace", "CoverTitle"))
story.append(p("Detailed Full-Stack Project Report", "CoverSubtitle"))
story.append(p("Microservices-based session booking marketplace using React, Django, PostgreSQL, Docker, Render, and Vercel.", "CoverSubtitle"))
story.append(Spacer(1, 0.35 * inch))
story.append(
    table(
        [
            ["Field", "Details"],
            ["Project Name", "Ahoum Sessions Marketplace"],
            ["GitHub Repository", "https://github.com/GoutamVaishnav/fullstack"],
            ["Frontend Deployment", "https://fullstack-oz4d0623g-goutams-projects-2519f78f.vercel.app/"],
            ["Architecture", "Microservices"],
            ["Frontend", "React, Vite, Tailwind CSS"],
            ["Backend", "Django, Django REST Framework, Gunicorn"],
            ["Database", "PostgreSQL"],
            ["Deployment", "Vercel frontend, Render backend services"],
        ],
        widths=[1.65 * inch, 4.5 * inch],
    )
)
story.append(PageBreak())

story.append(p("1. Project Overview", "H1Custom"))
story.append(
    p(
        "Ahoum Sessions Marketplace is a full-stack web application designed for discovering, publishing, and booking online sessions. "
        "The platform supports three major roles: users, creators, and admins. Users can browse and book sessions, creators can publish and manage their sessions, and admins can control users, sessions, and bookings across the platform."
    )
)
story.append(
    p(
        "The project is built with a microservices approach. Authentication, session management, and booking management are separated into independent Django backend services. The frontend is a React single-page application built with Vite and styled using Tailwind CSS."
    )
)

story.append(p("2. Objective", "H1Custom"))
story.extend(
    bullets(
        [
            "Provide a marketplace where users can discover and book sessions.",
            "Allow creators to create, update, delete, and manage sessions.",
            "Provide admins with a dashboard to manage users, sessions, and bookings.",
            "Use JWT-based authentication and role-based authorization.",
            "Keep the system deployable locally through Docker Compose and online through Render and Vercel.",
        ]
    )
)

story.append(p("3. Technology Stack", "H1Custom"))
story.append(
    table(
        [
            ["Layer", "Technology"],
            ["Frontend", "React, Vite, Tailwind CSS, JavaScript"],
            ["Backend", "Python, Django, Django REST Framework, Gunicorn"],
            ["Authentication", "JWT, Google OAuth, Demo Login"],
            ["Database", "PostgreSQL"],
            ["Infrastructure", "Docker, Docker Compose, Nginx, Redis"],
            ["Deployment", "Render for backend services, Vercel for frontend"],
        ],
        widths=[1.8 * inch, 4.35 * inch],
    )
)

story.append(p("4. System Architecture", "H1Custom"))
story.append(p("Local development uses Docker Compose and Nginx as a reverse proxy. The application is exposed at http://localhost:8080."))
story.append(
    code(
        """
Browser
  |
  v
Nginx Reverse Proxy :8080
  |
  |-- /              -> React frontend
  |-- /api/auth/     -> Django auth-service
  |-- /api/sessions/ -> Django sessions-service
  |-- /api/bookings/ -> Django bookings-service
  |
  v
PostgreSQL + Redis
"""
    )
)
story.append(p("In production deployment, the frontend is hosted on Vercel and backend services are hosted independently on Render."))

story.append(p("5. Main Backend Services", "H1Custom"))
story.append(p("5.1 Auth Service", "H2Custom"))
story.append(p("Folder: auth-service"))
story.extend(
    bullets(
        [
            "Handles Google OAuth and demo login.",
            "Issues JWT tokens after successful login.",
            "Stores user profile information and role data.",
            "Supports user, creator, and admin roles.",
            "Allows admins to list, update, block, unblock, and delete users.",
        ]
    )
)
story.append(p("Main model: Profile. Important fields include role, avatar, oauth_provider, oauth_id, and is_blocked."))

story.append(p("5.2 Sessions Service", "H2Custom"))
story.append(p("Folder: sessions-service"))
story.extend(
    bullets(
        [
            "Provides public session catalog.",
            "Allows creators and admins to create sessions.",
            "Allows creators to manage only their own sessions.",
            "Allows admins to view and manage all sessions.",
            "Supports active/inactive status, category, price, capacity, image URL, and meeting link.",
        ]
    )
)
story.append(p("Main model: Session. Important fields include creator_id, creator_name, title, description, category, starts_at, duration_minutes, price, capacity, image_url, meeting_link, and is_active."))

story.append(p("5.3 Bookings Service", "H2Custom"))
story.append(p("Folder: bookings-service"))
story.extend(
    bullets(
        [
            "Allows users to book sessions.",
            "Stores booking status as active or cancelled.",
            "Provides user booking history.",
            "Provides creator booking overview.",
            "Provides admin-level booking management.",
            "Prevents duplicate booking for the same user and session.",
        ]
    )
)
story.append(p("Main model: Booking. Important fields include user_id, user_name, user_email, session_id, session_title, session_creator_id, starts_at, status, and created_at."))

story.append(PageBreak())
story.append(p("6. Frontend Features", "H1Custom"))
story.append(p("The frontend is a React single-page application located in the frontend folder. It provides different dashboards based on the authenticated user role."))
story.append(p("User Dashboard", "H2Custom"))
story.extend(bullets(["View total bookings.", "View active, completed, and cancelled bookings.", "View booking history.", "Update profile.", "Switch to creator role."]))
story.append(p("Creator Dashboard", "H2Custom"))
story.extend(bullets(["Create sessions.", "Edit and delete sessions.", "View total sessions and active sessions.", "View booking overview.", "View revenue analytics.", "Switch to user role."]))
story.append(p("Admin Dashboard", "H2Custom"))
story.extend(bullets(["View total users, creators, sessions, and bookings.", "Search and filter users.", "Change user roles.", "Block or unblock users.", "Delete users.", "Manage all sessions and bookings."]))

story.append(p("7. API Endpoints", "H1Custom"))
story.append(
    table(
        [
            ["Service", "Endpoints"],
            ["Auth", "GET /api/auth/google/url/; POST /api/auth/google/callback/; POST /api/auth/dev-login/; GET/PATCH /api/auth/me/; GET/PATCH/DELETE /api/auth/admin/users/"],
            ["Sessions", "GET/POST /api/sessions/; GET /api/sessions/mine/; GET /api/sessions/admin/; GET/PATCH/DELETE /api/sessions/:id/"],
            ["Bookings", "GET/POST /api/bookings/; GET /api/bookings/creator/; GET /api/bookings/admin/; PATCH/DELETE /api/bookings/:id/"],
        ],
        widths=[1.15 * inch, 5.0 * inch],
    )
)

story.append(p("8. Database Design", "H1Custom"))
story.append(p("The project uses PostgreSQL. In local Docker development, separate databases are created for each service:"))
story.append(code("auth_db\nsessions_db\nbookings_db"))
story.append(
    p(
        "This separation follows the microservices principle of service-owned data. During free-tier deployment, a single managed PostgreSQL database can also be used by assigning the same database credentials to each service-specific database environment variable."
    )
)

story.append(p("9. Authentication and Authorization", "H1Custom"))
story.append(p("Authentication is handled using JWT tokens. After login, the auth service creates a JWT token containing user identity and role information. Other services decode this token to authorize requests."))
story.extend(
    bullets(
        [
            "Only users can book sessions.",
            "Only creators and admins can create sessions.",
            "Creators can update or delete only their own sessions.",
            "Admins can manage all users, sessions, and bookings.",
            "Blocked users can be restricted from platform access.",
        ]
    )
)

story.append(p("10. Local Setup", "H1Custom"))
story.append(p("Prerequisites: Docker Desktop and Docker Compose."))
story.append(code("docker compose up --build"))
story.append(p("Open the local application at:"))
story.append(code("http://localhost:8080"))
story.append(p("Stop the project with:"))
story.append(code("docker compose down"))

story.append(p("11. Deployment Approach", "H1Custom"))
story.append(p("The deployment is split between Vercel and Render."))
story.append(
    table(
        [
            ["Component", "Deployment Platform"],
            ["Frontend", "Vercel"],
            ["auth-service", "Render Docker Web Service"],
            ["sessions-service", "Render Docker Web Service"],
            ["bookings-service", "Render Docker Web Service"],
            ["Database", "Render PostgreSQL"],
        ],
        widths=[2.0 * inch, 4.15 * inch],
    )
)
story.append(p("Vercel settings for the frontend: root directory frontend, framework Vite, build command npm run build, output directory dist."))
story.append(p("Render services use Dockerfiles from their respective service folders and run Gunicorn after database migrations."))

story.append(p("12. Important Environment Variables", "H1Custom"))
story.append(
    code(
        """
POSTGRES_USER
POSTGRES_PASSWORD
DATABASE_HOST
DATABASE_PORT
AUTH_DB_NAME
SESSIONS_DB_NAME
BOOKINGS_DB_NAME
DJANGO_SECRET_KEY
JWT_SECRET
DEBUG
ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
OAUTH_REDIRECT_URI
ADMIN_EMAILS
ENABLE_DEV_LOGIN
"""
    )
)
story.append(p("For production, DEBUG should be 0. Demo login should be disabled by setting ENABLE_DEV_LOGIN to 0 after testing."))

story.append(PageBreak())
story.append(p("13. Key Features Implemented", "H1Custom"))
story.extend(
    bullets(
        [
            "Role-based platform with user, creator, and admin experiences.",
            "Public catalog and session detail pages.",
            "Creator session creation and management.",
            "User booking dashboard.",
            "Admin dashboard for platform management.",
            "JWT-based backend authorization.",
            "Dockerized local development environment.",
            "Render deployment support for backend services.",
            "Vercel deployment support for frontend.",
        ]
    )
)

story.append(p("14. Strengths", "H1Custom"))
story.extend(
    bullets(
        [
            "Clear microservices separation.",
            "Independent backend services for auth, sessions, and bookings.",
            "Docker Compose makes local setup straightforward.",
            "Role-specific dashboards make the application practical.",
            "Admin controls provide useful platform governance.",
            "Architecture can scale by deploying services independently.",
        ]
    )
)

story.append(p("15. Limitations", "H1Custom"))
story.extend(
    bullets(
        [
            "Payment gateway integration is not implemented.",
            "File upload is not implemented; sessions use image URLs.",
            "Email notifications are not implemented.",
            "Booking capacity can be further strengthened with stricter backend enforcement.",
            "Google OAuth requires correct production redirect URI and credential configuration.",
            "Automated tests are not included yet.",
        ]
    )
)

story.append(p("16. Future Scope", "H1Custom"))
story.extend(
    bullets(
        [
            "Integrate Stripe or Razorpay payments.",
            "Add email confirmations and session reminders.",
            "Add real file/image upload using S3 or MinIO.",
            "Add user reviews and ratings.",
            "Add creator payout dashboard.",
            "Add automated unit and integration tests.",
            "Add production logging, monitoring, and alerting.",
            "Improve analytics for admins and creators.",
        ]
    )
)

story.append(p("17. Conclusion", "H1Custom"))
story.append(
    p(
        "Ahoum Sessions Marketplace is a practical full-stack project demonstrating a session booking marketplace with separated backend services and a modern React frontend. "
        "It includes core marketplace functionality such as authentication, session publishing, booking management, and admin control. "
        "The project can run locally using Docker Compose and can be deployed through Render and Vercel. With future improvements such as payments, notifications, uploads, and tests, it can evolve into a production-ready marketplace platform."
    )
)


doc = SimpleDocTemplate(
    str(OUT),
    pagesize=A4,
    rightMargin=0.72 * inch,
    leftMargin=0.72 * inch,
    topMargin=0.72 * inch,
    bottomMargin=0.72 * inch,
    title="Ahoum Sessions Marketplace Project Report",
    author="Ahoum Assignment",
)
doc.build(story, onFirstPage=footer, onLaterPages=footer)
print(OUT)
