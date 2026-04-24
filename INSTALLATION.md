# 📦 Installation Requirements & Verification Guide

This file tells you **what to install** and **how to verify each tool is working correctly**
before you attempt to run the microservices project.

---

## 1. Docker Desktop (or Docker Engine + Docker Compose)

**What it does:** Builds and runs the containerised services (databases, backend, frontend).

### Install
| OS | Link |
|----|------|
| Windows / macOS | https://www.docker.com/products/docker-desktop |
| Ubuntu/Debian | `sudo apt-get install docker.io docker-compose-plugin` |

### Verify ✅
```bash
docker --version
# Expected: Docker version 24.x.x or higher

docker compose version
# Expected: Docker Compose version v2.x.x or higher

docker run --rm hello-world
# Expected: "Hello from Docker!" message printed
```

---

## 2. Node.js (v20 LTS) + npm

**What it does:** Runs the React frontend in development mode and builds it for production.

### Install
Download from https://nodejs.org/en (choose "20 LTS")
Or use a version manager:
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 20
nvm use 20
```

### Verify ✅
```bash
node --version
# Expected: v20.x.x

npm --version
# Expected: 10.x.x or higher
```

---

## 3. Python 3.11

**What it does:** Required only if you want to run backend services locally (outside Docker).
  Inside Docker, Python is already included in the container image.

### Install
Download from https://www.python.org/downloads/release/python-3110/

### Verify ✅
```bash
python3 --version
# Expected: Python 3.11.x

pip3 --version
# Expected: pip 23.x or higher
```

---

## 4. Minikube (for Kubernetes deployment)

**What it does:** Runs a local single-node Kubernetes cluster on your machine.

### Install
```bash
# macOS (Homebrew)
brew install minikube

# Windows (Chocolatey)
choco install minikube

# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
```

### Verify ✅
```bash
minikube version
# Expected: minikube version: v1.32.x or higher

minikube start
# Expected: Done! kubectl is now configured to use "minikube" cluster

minikube status
# Expected:
#   minikube: Running
#   kubelet:  Running
#   apiserver: Running
#   kubeconfig: Configured
```

---

## 5. kubectl (Kubernetes CLI)

**What it does:** Lets you apply K8s manifests, check pod status, and port-forward services.

### Install
```bash
# macOS
brew install kubectl

# Windows (Chocolatey)
choco install kubernetes-cli

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

### Verify ✅
```bash
kubectl version --client
# Expected: Client Version: v1.28.x or higher

# After minikube start:
kubectl get nodes
# Expected:
#   NAME       STATUS   ROLES           AGE   VERSION
#   minikube   Ready    control-plane   Xm    v1.28.x
```

---

## 6. Git

**What it does:** Required to clone the repo and for the CI/CD pipeline to trigger.

### Install
Download from https://git-scm.com/downloads

### Verify ✅
```bash
git --version
# Expected: git version 2.x.x
```

---

## 7. curl (for health checks)

**What it does:** Used inside Docker healthchecks and to manually test API endpoints.
  Usually pre-installed on macOS and Linux.

### Verify ✅
```bash
curl --version
# Expected: curl 7.x.x or 8.x.x
```

Windows users: Install via https://curl.se/windows/ or use `winget install cURL.cURL`

---

## Quick "Am I ready?" Checklist

Run each command and tick it off:

```
[ ] docker --version          → Docker 24+
[ ] docker compose version    → Compose v2+
[ ] docker run --rm hello-world → Hello from Docker!
[ ] node --version            → v20.x.x
[ ] npm --version             → 10.x.x
[ ] minikube version          → v1.32+  (K8s path only)
[ ] kubectl version --client  → v1.28+  (K8s path only)
[ ] git --version             → 2.x.x
[ ] curl --version            → 7.x.x or 8.x.x
```

If all boxes are ticked, proceed to `HOW_TO_RUN.md`.

---

## Common Problems

| Problem | Fix |
|---------|-----|
| `docker: command not found` | Docker Desktop not installed or not in PATH |
| `permission denied /var/run/docker.sock` | Add your user to the docker group: `sudo usermod -aG docker $USER` then log out/in |
| `docker compose` not found | You have old Compose V1 — upgrade Docker Desktop or install `docker-compose-plugin` |
| `minikube start` fails | Enable virtualisation in BIOS, or use `minikube start --driver=docker` |
| `npm ci` fails | Delete `node_modules/` and `package-lock.json`, run `npm install`, commit the new lock file |
