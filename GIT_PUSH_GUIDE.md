# GitHub Push Guide

Follow these steps to push your project to GitHub.

## 1. Initialize Git (if not already done)
Open your terminal in the `teros-app` directory and run:
```bash
git init
```

## 2. Add Your Files
Add all the project files to the staging area:
```bash
git add .
```

## 3. Create an Initial Commit
```bash
git commit -m "Initial commit: Advanced Emergency Routing AI"
```

## 4. Create a New Repository on GitHub
1. Go to [github.com/new](https://github.com/new).
2. Name your repository (e.g., `teros-app`).
3. Set it to **Public** or **Private**.
4. Do **NOT** initialize with a README, .gitignore, or license (we already have them).
5. Click **Create repository**.

## 5. Connect Local Repo to GitHub
Copy the commands from the "or push an existing repository from the command line" section on GitHub:
```bash
git remote add origin https://github.com/YOUR_USERNAME/teros-app.git
git branch -M main
git push -u origin main
```

*(Replace `YOUR_USERNAME` with your actual GitHub username)*

---

### 💡 Tips for a Clean Push:
- **Environment Variables**: Your `.env.local` is already in `.gitignore`, so your API keys won't be pushed to GitHub. This is good for security!
- **Node Modules**: The `node_modules` folder is also ignored to keep the repository size small.
- **Large Files**: Avoid committing large videos or images directly to Git if possible.
