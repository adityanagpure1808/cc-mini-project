# 🚀 How to Run the Project

Two deployment paths are covered:

- **Path A — Docker Compose** (recommended for local dev / demo)
- **Path B — Kubernetes / Minikube** (matches the assignment requirement)

Make sure all tools in `INSTALLATION.md` are verified before continuing.

---

## Path A — Docker Compose (Easiest)

### Step 1 — Clone / enter the repo

```bash
git clone <your-repo-url>
cd <repo-root>
```

### Step 2 — Start everything with one command

```bash
cd microservices-app
docker compose up --build
```

This single command:
1. Builds the Python backend images for `user-service` and `order-service`
2. Builds the React frontend and bundles it inside the nginx `gateway` image
3. Starts two PostgreSQL databases (`user-db`, `order-db`)
4. Starts both backend services (they wait for their DB to be healthy before starting)
5. Starts the nginx gateway (waits for both services to be healthy)

First run takes ~3–5 minutes while images download and pip installs packages.

### Step 3 — Verify services are up

```bash
# In a new terminal:
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"user-service"}

curl http://localhost:8001/health
# Expected: {"status":"ok","service":"user-service"}  (direct, no gateway)

curl http://localhost:8002/health
# Expected: {"status":"ok","service":"order-service"} (direct, no gateway)
```

### Step 4 — Open the app

Open your browser and navigate to:
```
http://localhost:8000
```

You will see the React login page.

1. Click **Register** → create an account
2. Log in with your credentials
3. Place an order on the Orders page

### Step 5 — Stop the project

```bash
# Ctrl+C in the compose terminal, then:
docker compose down
```

Data is persisted in Docker named volumes (`user-db-data`, `order-db-data`).
To also delete the data:
```bash
docker compose down -v
```

### Step 6 — Run in detached mode (background)

```bash
docker compose up --build -d
docker compose logs -f          # tail logs
docker compose down             # stop
```

---

## Path B — Kubernetes / Minikube

### Step 1 — Start Minikube

```bash
minikube start --driver=docker
```

### Step 2 — Point Docker to Minikube's daemon

This makes `docker build` images available inside the cluster without pushing to Docker Hub.

```bash
eval $(minikube docker-env)
```

> ⚠️ Run every terminal command below **in the same shell session** so the env vars stay set.

### Step 3 — Build images inside Minikube

```bash
# From the repo root:

docker build -t user-service:latest  ./microservices-app/backend/user-service
docker build -t order-service:latest ./microservices-app/backend/order-service

# Build frontend image (Dockerfile is at frontend/Dockerfile; context = repo root)
docker build -t frontend:latest -f frontend/Dockerfile .
```

### Step 4 — Apply Kubernetes manifests

```bash
cd microservices-app/k8s

# 1. Secret (JWT key)
kubectl apply -f secret.yaml

# 2. Databases + PersistentVolumeClaims
kubectl apply -f postgres.yaml

# 3. Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=user-db   --timeout=120s
kubectl wait --for=condition=ready pod -l app=order-db  --timeout=120s

# 4. Backend services
kubectl apply -f user-deployment.yaml
kubectl apply -f order-deployment.yaml

# 5. Wait for services to be ready
kubectl wait --for=condition=ready pod -l app=user-service  --timeout=120s
kubectl wait --for=condition=ready pod -l app=order-service --timeout=120s

# 6. Gateway (nginx + React frontend)
kubectl apply -f gateway.yaml
```

> Before applying `gateway.yaml`, edit line 30 and replace `YOUR_DOCKERHUB_USERNAME`
> with your actual Docker Hub username **if** you pushed the image. If you built locally
> with `eval $(minikube docker-env)` you can leave the image as `frontend:latest` and
> set `imagePullPolicy: Never`.

### Step 5 — Verify pods are running

```bash
kubectl get pods
```

Expected output (all pods `Running`, `READY 1/1`):
```
NAME                             READY   STATUS    RESTARTS
gateway-xxxx                     1/1     Running   0
order-db-xxxx                    1/1     Running   0
order-service-xxxx               1/1     Running   0
user-db-xxxx                     1/1     Running   0
user-service-xxxx                1/1     Running   0
```

### Step 6 — Open the app

```bash
minikube service gateway --url
```

Copy the printed URL (e.g. `http://192.168.49.2:30007`) and open it in your browser.

Alternatively use port-forwarding:
```bash
kubectl port-forward svc/gateway 8080:80
# Then open http://localhost:8080
```

### Step 7 — Verify services via kubectl

```bash
kubectl get services
# Verify: gateway has NodePort 30007

kubectl logs -l app=user-service  --tail=20
kubectl logs -l app=order-service --tail=20
```

### Step 8 — Tear down

```bash
kubectl delete -f .            # from inside k8s/ directory
minikube stop
```

---

## API Reference (for manual testing with curl/Postman)

All routes go through the gateway on port `8000` (Docker Compose) or the NodePort URL (K8s).

### Register a user
```bash
curl -X POST http://localhost:8000/users/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret"}'
```

### Login
```bash
curl -X POST http://localhost:8000/users/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret"}'
# Copy the access_token from the response
```

### Create an order (replace TOKEN and USER_ID)
```bash
curl -X POST http://localhost:8000/orders/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"user_id":"USER_ID","product":"Widget","amount":99.99}'
```

### List orders
```bash
curl http://localhost:8000/orders/api/orders \
  -H "Authorization: Bearer TOKEN"
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Gateway returns 502 | A backend service is still starting | Wait 30 s and refresh |
| `db connection failed` in logs | DB not healthy yet | Compose retries automatically; wait 1–2 min |
| `imagePullBackOff` in K8s | Image not in Minikube's registry | Run `eval $(minikube docker-env)` and rebuild |
| Port 8000 already in use | Another process using it | Stop it or change the host port in `docker-compose.yml` |
| Login returns 401 | Wrong password or DB was wiped | Re-register |
| `npm ci` fails in CI | `package-lock.json` out of sync | Run `npm install` locally, commit updated lock file |
