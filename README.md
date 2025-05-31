# React + TypeScript + Bun Setup

This is a simple React project set up using **Bun** as the package manager and **TypeScript**.

## 📋 Steps to Set Up the Project

### 1. Clone the Repository

First, clone the repository from GitHub:

```bash
git clone git@github.com:sipedis/sipedis-be.git
```

### 2. Install **Bun** (if you don't have it installed)

If you don't have **Bun** installed yet, follow the steps below:

- **For macOS/Linux**, run:

  ```bash
  curl -fsSL https://bun.sh/install | bash
  ```

- **For Windows**, run at PowerShell with Administrator privileges:
  ```
  powershell -c "irm bun.sh/install.ps1 | iex"
  ```

### 3. Install Project Dependencies

Now that Bun is installed, go to the project directory (the one you cloned) and install the dependencies using Bun:

```
cd sipedis-be
bun install
```

### 4. Start the Development Server

```
bun start
```

### 5. Last Step

Open http://localhost:8080
