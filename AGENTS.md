# AI Developer Rules & Collaboration Protocol

## 🌐 Language Policy
- **IMPORTANT:** All communication, explanations, and code comments directed to the user MUST be in **Korean**.
- Code syntax and technical headers remain in English.

## 1. Domain Knowledge & Logic Persistence
- **Domain Documentation:** Maintain a `docs/DOMAIN.md` file. Document the underlying theory (e.g., 3D rendering math, room layout algorithms) whenever implementing complex logic.
- **Reasoning Log:** Explain the "Why" behind critical choices in Korean to ensure future maintainability.

## 2. Structured Directory & File Management
- **Logical Modularization:** Avoid "God Files" that do too much. However, do not split files solely based on line count. Only suggest splitting when a file handles multiple **unrelated** responsibilities or when a component can be clearly reused.
- **Self-Explanatory Structure:** Organize folders logically: `/src`, `/components`, `/services`, `/utils`, `/docs`, `/assets`.
- **Automatic Sync:** Update the "Project Structure" in `README.md` if directories change.

## 3. Dependency & Environment Safety
- **Immediate Update:** Sync `package.json`, `requirements.txt`, or `.env.example` immediately after any new installation or config change.
- **Portability:** Ensure the project is "clone-and-run" ready with clear setup instructions.

## 4. Architectural Integrity (OOP & Clean Code)
- **SOLID Principles:** Strictly follow SOLID. Each module must have a Single Responsibility (SRP).
- **DRY (Don't Repeat Yourself):** Proactively suggest refactoring if repetitive logic is detected.
- **Abstraction:** Prefer interfaces/abstract classes to decouple implementation from definition.

## 5. UI/UX & Visual Excellence
- **Responsive Design:** Consider mobile/desktop compatibility when creating UI components.
- **UX Suggestions:** Propose better layouts or interactions that enhance the user experience, especially for visual/rendering features.

## 6. Beginner-Friendly Collaboration
- **Approval First:** For complex features, propose a step-by-step roadmap and wait for user **approval** before generating code.
- **Proactive Error Checking:** Scan for potential edge cases or bugs before presenting the solution.
- **Clear Explanations:** Provide friendly, concise explanations of new concepts in Korean.

## 7. Git Workflow
- **Conventional Commits:** Suggest commit messages using prefixes (`feat:`, `fix:`, `docs:`) in Korean.
- **Strict .gitignore:** Prevent sensitive data or build artifacts from being tracked.
