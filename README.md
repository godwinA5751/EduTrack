# EduTrack

**EduTrack** is a student-focused academic tracking application designed to help students manage their academic records, calculate semester GPAs and cumulative GPAs (CGPA), and monitor their academic progress.

The platform combines academic record management, PDF result extraction, offline support, and a separate administrative backend to provide a convenient way to manage academic information.

## Features

### Student Features

- **Authentication:** Secure registration and login using matriculation number and password.
- **Dashboard:** View academic progress, semester GPAs, level GPAs, and cumulative GPA.
- **Academic Levels:** Organize academic records by level.
- **Semester Management:** Manage courses and academic records across semesters.
- **GPA and CGPA Calculation:** Automatically calculate semester GPA, level GPA, and cumulative GPA.
- **Course Management:** Add, edit, and manage academic courses and grades.
- **Carryover Tracking:** Identify failed courses and track when they are successfully cleared.
- **PDF Result Import:** Upload academic result PDFs, extract course information, review extracted records, edit details, validate duplicates, and import approved courses.
- **Profile Management:** View and manage account information and change passwords.
- **Password Change Enforcement:** Require users to change temporary passwords when necessary.

### Progressive Web App (PWA)

EduTrack supports installation as a Progressive Web App on compatible devices.

- Installable on supported desktop and mobile browsers.
- Standalone application experience.
- Offline access to previously loaded academic information.
- IndexedDB-based storage for persisted application data.
- Offline changes can be synchronized when connectivity returns.
- User-specific cached academic data.
- Remember Me functionality for controlling session persistence.
- Automatic service worker updates.

### Administrative Features

EduTrack includes a separate Express backend for administrative operations.

Administrators can:

- View registered users.
- Search users by full name or matriculation number.
- Filter users by role.
- Navigate users through paginated results.
- View total user, student, and administrator statistics.
- Reset student passwords using generated temporary passwords.
- Require users to change their passwords after an administrative reset.
- Delete user accounts.
- Monitor backend and database connectivity.

Administrative endpoints are protected by Supabase token verification and administrator-role authorization.

## Technology Stack

### Frontend

| Technology | Purpose |
|---|---|
| React | User interface |
| Vite | Development server and build tool |
| JavaScript | Application logic |
| Tailwind CSS | Styling and responsive design |
| React Router | Client-side routing |
| TanStack Query | Server-state management and caching |
| Supabase JavaScript Client | Authentication and database access |
| PDF.js | PDF text extraction |
| IndexedDB / idb-keyval | Offline data persistence |
| vite-plugin-pwa | PWA and service worker support |
| Workbox | Offline caching support |

### Backend

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express 5 | REST API |
| Supabase JavaScript Client | Database and authentication administration |
| dotenv | Environment variable management |
| cors | Cross-origin resource sharing |
| express-rate-limit | API rate limiting |
| node-cache | In-memory caching |
| Nodemon | Development server restart |

### Database and Authentication

**Supabase** provides the database and authentication services used by EduTrack.

The frontend communicates directly with Supabase for supported student authentication and academic data operations. The separate Express backend handles privileged administrative operations.

## Project Architecture

```text
EduTrack/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── queries/
│   │   ├── services/
│   │   ├── providers/
│   │   └── lib/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── cache/
│   │   ├── adminCache.js
│   │   ├── cacheKey.js
│   │   └── cacheScheduler.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── rateLimiter.js
│   ├── routes/
│   │   ├── admin.js
│   │   └── heartbeat.js
│   ├── services/
│   │   └── adminService.js
│   ├── utils/
│   │   └── password.js
│   ├── server.js
│   ├── supabase.js
│   └── package.json
│
└── README.md
```

## GPA Calculation

EduTrack uses a five-point grading system.

| Grade | Grade Point |
|---|---:|
| A | 5 |
| B | 4 |
| C | 3 |
| D | 2 |
| E | 1 |
| F | 0 |

### GPA Formula

\[
GPA = \frac{\sum(\text{Course Units} \times \text{Grade Points})}{\sum(\text{Course Units})}
\]

The cumulative GPA is calculated using the applicable academic records and carryover rules.

EduTrack also tracks failed courses and their subsequent successful attempts so that cleared carryovers can be reflected appropriately in academic progress.

## Backend API

The backend provides administrative endpoints and a health-check endpoint.

### Base Routes

| Method | Endpoint | Description |
|---|---|---|
| GET | `/heartbeat` | Checks backend and database connectivity |
| GET | `/admin/users` | Retrieves users with pagination, search, and role filtering |
| POST | `/admin/reset-password` | Resets a user's password |
| DELETE | `/admin/users/:id` | Deletes a user account |

### Authentication

All `/admin` endpoints require an administrator's valid Supabase access token.

Include the token in the request header:

```http
Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN
```

The backend verifies the token, retrieves the corresponding profile, and checks that the user's role is `admin`.

### Retrieve Users

```http
GET /admin/users?page=1&limit=10&search=&role=all
```

Supported query parameters:

| Parameter | Description |
|---|---|
| `page` | Requested page number |
| `limit` | Number of users per page |
| `search` | Search by full name or matriculation number |
| `role` | Filter by role, or use `all` |

The response includes user records, statistics, and pagination information.

### Reset User Password

```http
POST /admin/reset-password
```

Request body:

```json
{
  "profileId": "USER_PROFILE_ID"
}
```

The backend generates a temporary password, updates the user's Supabase Auth password, and sets `must_change_password` to `true` in the user's profile.

Administrator accounts cannot be reset through this endpoint.

### Delete User

```http
DELETE /admin/users/USER_ID
```

The backend prevents administrators from deleting their own accounts. It deletes the user from Supabase Auth and removes the corresponding profile.

### Health Check

```http
GET /heartbeat
```

This endpoint performs a database connectivity check and returns the backend's health status.

## Caching and API Protection

The backend includes additional mechanisms to improve administrative API performance and security.

- User listing results are cached using NodeCache.
- Cache entries have a five-minute time-to-live.
- Expired cache entries are checked every minute.
- A background scheduler refreshes the default user listing cache every five minutes.
- Administrative password resets and user deletions invalidate the cache.
- Administrative routes are limited to 50 requests per 15-minute window.
- All administrative routes require administrator authentication.

## Getting Started

### Prerequisites

Make sure you have the following installed:

- Node.js
- npm
- Git
- A Supabase project

### 1. Clone the Repository

```bash
git clone https://github.com/godwinA5751/EduTrack.git
cd EduTrack
```

### 2. Frontend Setup

Navigate into the frontend directory:

```bash
cd frontend
npm install
```

Configure the frontend environment variables required by your Supabase client and API configuration.

Start the development server:

```bash
npm run dev
```

Vite will display the local development URL in your terminal.

### 3. Backend Setup

Open another terminal and navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory.

Add the following environment variables:

```env
PORT=5000

DEV_URL=YOUR_FRONTEND_DEVELOPMENT_URL
FRONTEND_URL=YOUR_FRONTEND_PRODUCTION_URL

SUPABASE_URL=YOUR_SUPABASE_PROJECT_URL
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

Replace the placeholders with the appropriate values from your environment.

**Important:** The service-role key is a private server-side credential. Never expose it in frontend code, commit it to Git, or share it publicly.

Start the backend in development mode:

```bash
npm run dev
```

For production:

```bash
npm start
```

The backend uses port `5000` by default when `PORT` is not specified.

## Environment Variables

### Backend

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `DEV_URL` | Allowed frontend development origin |
| `FRONTEND_URL` | Allowed frontend production origin |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Private Supabase service-role key |

The backend uses the two frontend origin variables to configure CORS.

### Frontend

Configure the environment variables expected by the frontend's Supabase client and API configuration. Keep private service-role credentials exclusively on the backend.

## PWA Installation

EduTrack can be installed on supported devices.

**Desktop:**
1. Open EduTrack in a supported browser.
2. Use the browser's install option when available.
3. Launch EduTrack from the installed application.

**Mobile:**
1. Open EduTrack in a supported mobile browser.
2. Open the browser menu.
3. Select the available installation option, such as Add to Home Screen or Install App.
4. Launch EduTrack from your home screen.

Previously loaded academic data can remain available offline. Features that require a live server or database connection may need an internet connection.

## Security Considerations

EduTrack uses Supabase authentication and role-based authorization to protect administrative functionality.

Security measures include:

- Supabase access-token verification.
- Administrator-role verification.
- Protected administrative API routes.
- Rate limiting.
- Server-side storage of privileged Supabase credentials.
- Password-change enforcement after administrative resets.
- CORS origin restrictions.

Never publish environment files or private credentials.

## Project Goals

EduTrack aims to make academic record management easier by providing students with a convenient way to:

- Track semester and cumulative academic performance.
- Organize academic records by level and semester.
- Monitor carryover courses.
- Import academic results from PDF documents.
- Access previously synchronized academic information offline.
- Manage academic progress from desktop and mobile devices.

## License

This project is currently maintained as a personal software project.

