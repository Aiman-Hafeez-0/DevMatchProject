# DevMatch 🎯

> A full-stack developer collaboration platform that matches developers to projects based on real skill alignment — and builds a verified contribution history as they work.

Built with **React**, **Flask**, **PostgreSQL**, and **Socket.IO** — featuring skill-based matching, real-time team chat, private project invites, and a verified contribution ledger that goes beyond a GitHub commit graph or a generic star rating.

---

## ✨ Features

### Landing & Onboarding

- **Public landing page** — hero section, feature grid, "how it works" walkthrough, and CTA, shown before any login/signup wall
- **Session-based auth** — bcrypt-hashed passwords, email normalization, first name carried through the session for personalized greetings
- **Guided profile completion** — new users are routed straight to profile setup (skills, experience level, GitHub, bio) before reaching the dashboard

### Matching & Discovery

- **Skill-based Matching** — every visible project is scored against your skill set, with a visual match ring, and a clear breakdown of which required skills you already have vs. which you'd need to learn
- **Browse & Filter Projects** — search by title/tech/description, filter by urgency and paid/free, filter by tech stack chip, toggle between grid and list view
- **Developer Profiles** — skills as chips, experience level, GitHub link, bio, and a list of projects owned and joined
- **Profiles Page** — browse all developers with skill tags, click through to a full public profile

### Project Lifecycle

- **Create, edit, delete projects** — including editable problem statements (remove one once a contributor solves it, add new ones as scope evolves)
- **Public join requests** — request to join any public project; owner accepts/rejects from a dedicated Requests tab
- **Private projects + invite system** — private projects are invisible to public discovery; the only way in is an owner-initiated, username-based invite. Invitee gets a notification with Accept/Decline; owner is notified back either way
- **Member management** — project owners can view all accepted members and remove anyone (never removable by non-owners)

### Real-Time Collaboration

- **Per-project group chat** — Socket.IO powered, auto-created the moment a project is created (owner is added immediately) and auto-populated when a join request or invite is accepted
- **File & image sharing** — drag in an image for an inline preview, or any document/zip/media file as a download card
- **Message grouping** — consecutive messages from the same sender are visually grouped with date dividers, sender name, and avatar, WhatsApp-style
- **My Chats hub** — every project chat you're part of, sorted by most recent activity, with a live last-message preview
- **Unread indicator** — a badge on the Chats nav link whenever any project chat has an unread message, cleared automatically the moment you open that chat

### Notifications

- Redesigned notification center with a type-specific icon and color per event (join request, accepted, declined, invite, invite accepted/declined, credit received)
- Relative timestamps ("5m ago", "2h ago")
- Notifications that require a decision (join requests, invites) show inline Accept/Decline buttons; informational notifications are entirely clickable and route straight to the relevant project
- Live polling on the bell icon so counts update even if the dropdown is never opened
- Dismiss individually or clear all in one click

### Verified Contribution Ledger — the core differentiator

Unlike a GitHub commit graph (which only proves activity) or a Fiverr/Upwork star rating (which is generic and paid-only), DevMatch ties credit to a **specific, pre-defined problem statement**, attested by the person who actually wrote that problem statement and worked alongside the contributor:

- Project owner clicks **⭐ Give Credit** next to any accepted member
- Picks the exact problem statement solved from the project's own list, rates it 1–5 stars, marks paid/unpaid, and can leave a note
- This becomes a permanent, timestamped entry visible on the contributor's public profile under **Verified Contributions** — showing total problems solved, average rating, and % paid work as headline stats, with the full attested history below
- Contributors are notified the moment they receive credit

---

## 🛠 Tech Stack

| Layer     | Technologies                                                                             |
| --------- | ---------------------------------------------------------------------------------------- |
| Frontend  | React 18, Vite, React Router, Socket.IO Client, Bootstrap 5, React Icons, React Toastify |
| Backend   | Python 3, Flask, Flask-SocketIO, Flask-CORS, bcrypt, psycopg2                            |
| Database  | PostgreSQL 15                                                                            |
| Real-time | Socket.IO (eventlet)                                                                     |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL 15

### Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE devmatch_db;
```

Run your schema (tables: `users`, `projects`, `project_participants`, `project_chat_rooms`,
`project_chat_members`, `project_chat_messages`, `notifications`, `seeker_profile`,
`contributions`, `ratings`, `project_tasks`, `task_activity`).

Then apply the following constraints and columns, required for the chat and matching systems:

```sql
-- Chat room / membership integrity
ALTER TABLE project_chat_rooms
  ADD CONSTRAINT IF NOT EXISTS project_chat_rooms_project_id_key UNIQUE (project_id);

ALTER TABLE project_chat_members
  ADD CONSTRAINT IF NOT EXISTS project_chat_members_room_user_key UNIQUE (room_id, user_id);

-- Unread-chat tracking
ALTER TABLE project_chat_members
  ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP DEFAULT NOW();

-- Verified contribution ledger
CREATE TABLE IF NOT EXISTS contributions (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    problem_statement TEXT NOT NULL,
    contributor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attested_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_paid BOOLEAN DEFAULT false,
    stars INTEGER CHECK (stars BETWEEN 1 AND 5),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

> If you're setting this up fresh and already have existing projects/participants from before
> these features existed, also run a one-time backfill to populate `project_chat_rooms` and
> `project_chat_members` for pre-existing data — see `docs/migration-notes.sql` if present, or
> ask for the backfill script.

### Backend Setup

```bash
cd DevMatch-Backend

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and secret key

# Run the server
python app.py
```

Server runs at `http://localhost:5000`

### Frontend Setup

```bash
cd DevMatch-Frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

App runs at `http://localhost:5173`

---

## 📁 Project Structure

```
DevMatch-Backend/
├── app.py               # Flask app factory, blueprint registration, SocketIO init, uploads route
├── auth.py              # Register, login, logout, session, dashboard stats
├── profiles.py          # Profile CRUD, all profiles, individual profile view + contribution ledger
├── projects.py          # Project CRUD, join requests, invites, notifications, matching, credit ledger
├── chat.py              # Chat rooms, message history, file upload, unread tracking, Socket.IO events
├── db.py                # PostgreSQL connection helper
├── socketio_instance.py # Shared SocketIO instance (avoids circular imports)
├── requirements.txt
└── .env.example

DevMatch-Frontend/
├── src/
│   ├── components/
│   │   ├── LandingPage.jsx       # Public marketing page shown before login
│   │   ├── Dashboard.jsx         # Live stats + quick actions
│   │   ├── AllProjects.jsx       # Browse + filter all projects
│   │   ├── Matches.jsx           # Skill-based project matching with visual match rings
│   │   ├── ChatRoom.jsx          # Real-time group chat with file sharing + member management
│   │   ├── MyChats.jsx           # All chats the user is part of, with unread tracking
│   │   ├── ViewProjects.jsx      # Created / Joined / Requests tabs, edit & delete, invite modal
│   │   ├── CreateProjectForm.jsx # New project form with chip-based tech stack input
│   │   ├── ProjectDetails.jsx    # Project detail, join/request, members, Give Credit modal
│   │   ├── ProfilesPage.jsx      # All developer profiles
│   │   ├── UserProfile.jsx       # Individual profile incl. Verified Contributions ledger
│   │   ├── SeekerProfileForm.jsx # Edit profile with skill chips
│   │   ├── NotificationsDropdown.jsx  # Type-aware notification center
│   │   ├── Navbar.jsx            # Nav with live notification bell + unread chat badge
│   │   ├── LoginForm.jsx
│   │   └── RegisterForm.jsx
│   ├── context/
│   │   └── AuthContext.jsx       # Global auth state + session management
│   └── App.jsx                   # Routes
```

---

## 🔑 Key Engineering Decisions

**Single source of truth for chat membership** — `project_chat_members` is populated the moment
a project is created (owner) and the moment a join request or invite is accepted (new member).
This keeps "My Chats" accurate without recomputing membership from `project_participants` at
query time.

**Private projects require an explicit invite, not just visibility hiding** — a private project
sets `is_private = true`, which removes it from public discovery and blocks direct join
requests server-side. The only path in is `project_participants.status = 'invited'`, created by
the owner via username lookup, which the invitee can accept or decline — running through the
exact same chat-room-provisioning pipeline as a normal accepted request once approved.

**Contribution attribution is anchored to pre-committed scope** — credit can only be given for
one of the project's own `problem_statements`, defined by the owner _before_ work began. This is
what makes the ledger meaningfully different from a generic rating: the claim being attested is
specific and falsifiable, not a vague "did a good job."

**Eliminated N+1 query on project listing** — `GET /projects/all` uses a `LEFT JOIN` on
`project_participants` to return each user's participation status alongside the project data in
a single query, so `ProjectCard` never needs its own follow-up API call per card.

**Circular import prevention** — `SocketIO` is instantiated once in `socketio_instance.py` and
imported by both `app.py` (for `init_app`) and `chat.py` (for event handlers), avoiding the
circular dependency that would arise from initializing it inside either file directly.

---

## 👩‍💻 Author

**Aiman Hafeez** — Final-year Computer Science student at Begum Nusrat Bhutto Women University, Sukkur.

[GitHub](https://Aiman-Hafeez-0) · [LinkedIn](www.linkedin.com/in/aiman-hafeez-)
