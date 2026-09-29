# 60–90 Second Hackathon Demo Video Script

**Project Title:** Incident Memory Agent  
**Tagline:** Every incident teaches the next one.  
**Focus:** Demonstrating the tangible difference persistent memory makes in AI incident response.

---

### [0:00 - 0:15] The Problem
- **Visual:** Open on the **Incident Operations Dashboard** (`/`). Hover over the 8 active and resolved incidents and the severity distribution charts.
- **Narrator / Voiceover:**
  > *"Every engineering team knows the pain of recurring production outages. An API fails, a database connection pool exhausts, and engineers spend hours in logs investigating a problem someone already solved three months ago. Standard AI assistants are stateless—they forget everything the moment the chat ends. We built **Incident Memory Agent**, powered by Vectorize Hindsight."*

---

### [0:15 - 0:35] Incident Intake & AI Triage
- **Visual:** Click **"Report Incident"** (`/incidents/new`). Click the **"Connection Pool"** quick preset. Show the pre-filled telemetry: `Payment-API`, Critical severity, and HikariCP connection timeout logs. Click **"Submit Incident & Triage"**.
- **Narrator / Voiceover:**
  > *"When an incident strikes, the agent doesn't just read the error message. It automatically reaches into its **Hindsight persistent memory bank** to search for relevant historical resolutions, root causes, and previous failed attempts."*

---

### [0:35 - 0:50] Real-World Learning Loop
- **Visual:** Navigate to an active incident detail page. Show the structured investigation report: the distinction between **hypotheses** and **verified facts**, recommended diagnostics, and the human verification notice. Click **"Confirm Resolution & Teach Hindsight"**. Fill in the root cause and verified resolution steps.
- **Narrator / Voiceover:**
  > *"Crucially, the agent never assumes a proposed fix worked until an engineer confirms it. Once verified, the outcome is permanently retained in Hindsight. Even failed attempts are preserved so future engineers don't waste time repeating them."*

---

### [0:50 - 1:15] The Grand Finale: Before vs. After Memory Demo
- **Visual:** Click **"Memory Demo"** (`/demo`) in the sidebar. Click **"Run Live Comparison Demo"**. Scroll through the side-by-side comparison.
- **Narrator / Voiceover:**
  > *"Here's the power of Hindsight in action. We feed the exact same error symptom to two parallel investigations. On the left: Investigation A without memory. The LLM produces generic guesses, vague network checks, and risks recommending ineffective pod restarts. On the right: Investigation B with Hindsight. It instantly recalls Incident 0001 with a 92% match score, provides the exact verified pool size fix, and warns against useless restarts—cutting MTTR from hours to minutes."*

---

### [1:15 - 1:30] Conclusion & Impact
- **Visual:** Switch to **"Memory Explorer"** (`/memory`). Show the live recall tester querying `"connection pool exhausted"` with instant relevance scores.
- **Narrator / Voiceover:**
  > *"With Hindsight, engineering organizations build a compounding institutional memory. Every incident truly teaches the next one. Thank you!"*
