# Escape The Code

A gamified learning platform that helps beginners learn JavaScript through interactive lessons, coding challenges, automated grading, and AI-generated feedback.

**Live Demo:** https://escapethecode.cloud

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-runtime-339933?logo=node.js&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-database-4479A1?logo=mysql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![Deno](https://img.shields.io/badge/Deno-Sandbox-000000?logo=deno&logoColor=white)
![Ollama](https://img.shields.io/badge/Ollama-Llama%203.2-white)

This repository contains the **TypeScript + Express backend** powering authentication, course progression, sandboxed code execution, automated grading, gamification, and AI-generated feedback.

---

## Why I Built This

Many beginners struggle to stay engaged while learning programming. Tutorials often explain concepts but provide limited opportunities to practice writing real code or understand why a solution failed.

Escape The Code turns learning JavaScript into a progression loop where learners complete lessons, solve coding challenges, receive automated grading, unlock achievements, earn rewards, and get beginner-friendly AI feedback based on their own code.

---

## Highlights

- **Sandboxed code execution** — executes untrusted JavaScript inside an isolated Deno child process with a **3-second timeout**, **256 MB V8 heap limit**, and **no filesystem, network, environment, subprocess, or FFI permissions**.
- **Automated grading pipeline** — evaluates submissions against stored test cases and records outputs, errors, execution time, and pass/fail results.
- **AI-powered feedback** — streams personalized code reviews over **Server-Sent Events (SSE)** using **Llama 3.2** running through Ollama.
- **Gamification engine** — manages points, credits, streaks, hint purchases, achievements, and progression using an auditable credit transaction ledger.
- **Feature-based modular monolith** — separates authentication, courses, challenges, code execution, achievements, and users into independent modules while deploying as a single application.

---

## Tech Stack

| Area           | Technology                           |
| -------------- | ------------------------------------ |
| Backend        | Node.js, Express.js, TypeScript      |
| Database       | MySQL, Drizzle ORM                   |
| Authentication | JWT, bcryptjs                        |
| Validation     | Zod                                  |
| Code Execution | Deno                                 |
| AI             | Ollama + Llama 3.2                   |
| Email          | Nodemailer + EJS                     |
| Frontend       | Nuxt.js, Vue.js, Pinia, Tailwind CSS |

---

## Architecture

```text
                    Client (Nuxt)
                         │
                    REST API + JWT
                         │
                  Express Application
                         │
      ┌──────────────────┼──────────────────┐
      │                  │                  │
 Authentication     Learning Engine     Code Runner
      │                  │                  │
      ├──────────────┬───┘                  │
      │              │                      │
Achievements     Transactions         Deno Sandbox
      │                                     │
      └──────────────────┬──────────────────┘
                         │
                    Drizzle ORM
                         │
                       MySQL
                         │
                  Ollama (AI Feedback)
```

Student submissions execute inside a **separate Deno process** rather than Node's `vm`, leveraging Deno's secure-by-default permission model. The sandbox runs without filesystem, network, environment, subprocess, or FFI access while enforcing strict execution time and memory limits.

---

## Database Model

```text
User
├── Progress
├── Challenge Submissions
├── Achievements
├── Transactions
└── Profile

Course
└── Chapter
     └── Section
          ├── Lesson
          └── Challenge
               ├── Test Cases
               ├── Hints
               └── Solutions
```

The backend uses a normalized relational schema to separate learning content, user progression, submissions, achievements, and financial transactions while maintaining clear relationships between each domain.

---

## Request Flow

### Code Submission

```text
Student Code
      │
      ▼
Validate Request (Zod)
      │
      ▼
Execute in Deno Sandbox
      │
      ▼
Run Stored Test Cases
      │
      ▼
Persist Submission
      │
      ▼
Return Execution Results
```

### Challenge Completion

```text
Challenge Solved
      │
      ▼
Update Progress
      │
      ▼
Award Points & Credits
      │
      ▼
Evaluate Achievement Rules
      │
      ▼
Generate AI Feedback (SSE)
      │
      ▼
Return Rewards + Feedback
```

---

## Project Structure

```text
src/
├── config/
├── helpers/
├── middlewares/
├── modules/
│   ├── achievements/
│   ├── auth/
│   ├── challenges/
│   ├── chapters/
│   ├── code-runner/
│   ├── courses/
│   ├── sections/
│   ├── transactions/
│   └── users/
├── runners/
├── services/
├── templates/
├── tests/
└── types/
```

Each feature owns its routes, validation schemas, and request handlers while sharing common middleware, helpers, services, and infrastructure. This keeps the codebase modular without introducing the operational complexity of microservices.

---

## Engineering Challenges

### Running Untrusted Code Safely

Student JavaScript is executed in an isolated Deno child process with strict permission restrictions, execution timeouts, and memory limits. Infinite loops, syntax errors, and resource abuse are handled without affecting the main API process.

### Automated Grading

Submissions are evaluated against predefined test cases, with execution output, runtime, errors, and assertion results stored for grading, history, analytics, and AI prompting.

### AI-Assisted Learning

Instead of returning only pass/fail results, the backend streams beginner-friendly feedback using Server-Sent Events after progress and rewards have been processed.

### Gamification

Achievements, streaks, hint purchases, and rewards are driven by actual learner behavior, while all credit changes are recorded in an auditable transaction ledger.

---

## API Overview

The backend exposes a JWT-secured REST API organized into feature modules.

### Authentication

- Register
- Login
- Email verification
- Password reset

### Learning

- Courses
- Chapters
- Sections
- Progress tracking
- Leaderboards

### Challenges

- Start challenge
- Submit code
- Multiple-choice answers
- Buy hints
- Complete challenge
- Stream AI feedback

### User

- Dashboard
- Profile updates
- Avatar & banner
- Password changes

### System

- Code Runner
- Achievements
- Transactions

> Complete endpoint documentation can be provided separately (OpenAPI or API.md).

---

## Getting Started

### Requirements

- Node.js
- MySQL
- Deno
- Ollama _(optional for AI feedback)_

### Installation

```bash
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL=mysql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
JWT_SECRET=your_jwt_secret

# Optional — see defaults below
PORT=3000
NODE_ENV=development
JWT_EXPIRATION_IN_MINUTES=1440
DOMAIN_NAME=http://localhost:3000
FRONTEND_URL=http://localhost:5000
UPLOADS_PATH=uploads
DENO_BIN=deno
```

`DATABASE_URL` and `JWT_SECRET` are required. Everything else falls back to a sensible default (see table below) — mail settings (`MAIL_HOST`, `MAIL_PORT`, etc.) only matter if you're testing email verification/reset locally, and `PYTHON_EXEC` is only needed for the legacy feedback path in `src/feedback.ts`.

Then seed demo data and start the server:

```bash
npx tsx src/seed.ts

npm run dev
```

The API starts at:

```text
http://localhost:3000
```

---

## Future Improvements

- Automated unit and integration testing
- Dedicated worker process for sandbox execution
- Rate limiting on auth, code execution, and AI feedback endpoints
- OpenAPI/Swagger documentation
- Role-based access control

---

## Author

**Mikee Laurente**

- Live Demo: https://escapethecode.cloud
- LinkedIn: https://www.linkedin.com/in/mikee-laurente-0773313a6/
