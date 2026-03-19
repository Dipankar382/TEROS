# Teros Git Push Guide

Follow these commands to commit and push your latest updates to the GitHub repository.

### 1. Stage all changes
This command adds all modified and new files to the staging area.
```bash
git add .
```

### 2. Commit the changes
Create a commit with a professional message describing the updates.
```bash
git commit -m "feat: optimize role-based dashboard, fix emergency response, and update README"
```

### 3. Push to the repository
Push your local commits to the remote repository (assuming your branch is `main`).
```bash
git push origin main
```

---

### Additional Tips for a Professional Repository:
- **Branching**: If you are working on a new feature, consider creating a branch first: `git checkout -b feature/dashboard-opt`.
- **Status Check**: You can always check which files are modified using `git status`.
- **Log**: View your commit history with `git log --oneline -n 5`.

🚀 **Happy Coding!**
