

# EduLinker Student Portal — Updated Implementation Plan

## Overview
A **read-only** student portal connected to the **same Supabase backend** as the Admin app. Students log in with email/password, then enter their `secret_id` to link to their student record. All data is filtered to show only the logged-in student's information.

**No schema changes, no new tables, no RLS modifications.**

---

## 1. Supabase Connection & Auth
- Connect to the **same Supabase instance** (same URL + anon key)
- Copy Supabase client config and generated types from admin app
- Email/password login only — no signup option (students are pre-registered by admin)

## 2. Authentication & Secret ID Flow

### Login Page
- Identical dark theme design with golden accent, glass card styling, and falling lines background animation — matching the admin app

### Secret ID Entry Screen (after login)
- Student enters their `secret_id` to link to their student record
- Validate against the `students` table

### 🔒 Secret ID Persistence (Session Survival)
- After successful `secret_id` validation, store `student_id` in **localStorage** (`linked_student_id`)
- On every app load, check:
  1. Is user logged in (Supabase session)?
  2. Does `linked_student_id` exist in localStorage?
- If either is missing → redirect to the appropriate screen (login or secret ID entry)
- On logout → clear localStorage key

### 🔒 Brute Force Protection
- Track failed secret ID attempts in component state (per session)
- **Max 5 wrong attempts** per session
- **1-second delay** added per attempt (progressive — attempt 1 = 1s, attempt 2 = 2s, etc.)
- After 5 failed attempts → **auto-logout** the user with a toast message: *"Too many failed attempts. Please log in again."*
- Counter resets on successful login

### Route Protection
- All routes protected — redirect to login if no session
- Redirect to secret ID screen if session exists but no linked student

---

## 3. Layout & Theme
- **Same dark theme** with golden accent color scheme
- **Same glass card styling** (`bg-black/30 backdrop-blur-md border border-primary/20`)
- **Golden falling lines background animation**
- **Sidebar navigation** with items:
  - 📊 Dashboard
  - 📚 Homework
  - 📝 Results
  - 💬 Complaints
  - 📢 Announcements
  - 📈 Academic Performance
  - 🤖 AI Insight
  - 🚪 Logout
- **Header** with student name display and logout button

---

## 4. 📅 Academic Year Filtering (Global)
- **Academic year** = April to March (e.g., April 2025 – March 2026)
- **Default**: Auto-detect current academic year based on today's date
- **Dropdown selector** in the header/dashboard area to switch academic year
- Applied globally to filter data in:
  - Results (by exam date or `created_at`)
  - Homework (by `created_at`)
  - Complaints (by `created_at`)
  - Academic Performance charts
- Year options generated dynamically from available data range

---

## 5. Student Dashboard
- Welcome card showing student name, standard, section
- Quick stats: total subjects, overall percentage, recent homework count
- All filtered by linked `student_id` and selected academic year

## 6. Homework Panel
- List homework filtered by student's `standard` + `section` and academic year
- Ordered by `created_at` descending
- Show subject, description, date, and file link if available

## 7. Results Panel
- Results filtered by `student_id` and academic year
- Display: Subject, Marks Obtained, Total Marks, Percentage
- File preview link if `file_name` exists

## 8. Complaints Panel
- Complaints filtered by `student_id` and academic year
- Display description and date — read-only

## 9. Announcements Panel
- Show all global announcements (no student filter)
- Display title, content, type, and date

## 10. Academic Performance Panel
- **Identical layout** to Admin Analytics performance section
- Filtered by academic year
- **Overall percentage** — average of all percentage values for this student
- **Subject-wise breakdown** — colored progress bars per subject
- **Performance summary card** — overall avg, total subjects, best subject, results count
- **Trend chart** — Recharts line/bar chart showing percentage over time per subject

## 11. AI Insight Chatbot (Rule-Based)
- Chat-style interface with text input
- Recognizes keywords: "overall performance", "math result", "weak subject", "improvement", "best subject"
- Fetches **real data** from student's results in Supabase (filtered by academic year)
- Generates dynamic responses using pure JS logic — no external AI APIs
- Typing animation for conversational feel

---

## Security Summary
- ✅ All routes protected behind auth + secret ID check
- ✅ Secret ID brute force protection (5 attempts max, progressive delay, auto-logout)
- ✅ Student ID persisted in localStorage (survives reload)
- ✅ All queries filtered by `student_id` + academic year
- ✅ Parent contact details never displayed
- ✅ No create/update/delete operations
- ✅ No schema changes

