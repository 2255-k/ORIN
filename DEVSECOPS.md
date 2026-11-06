# ORIN DevSecOps: CI pipeline + GitOps with Argo CD

## Pipeline flow (GitHub Actions)

```
push / PR
   |
   +--> quality ........ typecheck + build
   +--> sast ........... Semgrep + Gitleaks
   +--> dependency-scan  Trivy (CVEs, licenses) + SBOM
            |
            v   (all three must pass)
         build ......... build server + client images, Trivy image scan,
            |            push to GHCR (main only)
            v
          dast ......... run full stack (mongo+server+client), OWASP ZAP baseline
            |
            v
     gitops-update ..... bump image tags in k8s/kustomization.yaml, commit
            |
            v
         Argo CD ....... detects the commit, syncs the cluster
```

PRs run quality, SAST, dependency scan and the image build/scan, but do not push images, run DAST or deploy.

## 1. Copy files into your repo

Copy these into the root of your ORIN repo, keeping the paths:

- `.github/workflows/ci.yml`
- `server/Dockerfile`
- `client/Dockerfile`, `client/nginx.conf`
- `docker-compose.ci.yml`
- `k8s/` (all files)
- `argocd/application.yaml`

Also add a `.dockerignore` in `server/` and `client/` containing `node_modules`, `dist`, `.env` and `uploads`.

## 2. Things your app must provide

- `GET /api/health` returning 200 (used by probes, Docker healthcheck and DAST). If your route differs, change it in `server/Dockerfile`, `k8s/server.yaml` and `ci.yml`.
- `npm start` in `server/` that runs the API (the Dockerfile runs `npm run build --if-present` first, so TypeScript output works too).
- `package-lock.json` committed in root, `server/` and `client/` (needed for `npm ci` and for Trivy to scan dependencies).

## 3. GitHub settings

1. Settings > Actions > General > Workflow permissions: **Read and write**.
2. After the first push, make the two GHCR packages (`orin-server`, `orin-client`) accessible to your cluster. Easiest: set them to public. If private, create an image pull secret in the cluster.
3. Optional: enable code scanning (Settings > Code security) so Semgrep results show in the Security tab.

## 4. Replace placeholders

- `k8s/kustomization.yaml`: `OWNER` (the pipeline overwrites it automatically on the first main build).
- `argocd/application.yaml`: `repoURL`.
- `k8s/ingress.yaml` and `CLIENT_URL` in `k8s/server.yaml`: your real domain.

## 5. Cluster + Argo CD setup (one time)

Local test cluster:

```bash
kind create cluster --name orin
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
# ingress controller (kind)
kubectl apply -f https://kind.sigs.k8s.io/examples/ingress/deploy-ingress-nginx.yaml
```

Create the secret the server needs (never commit it):

```bash
kubectl create namespace orin
kubectl -n orin create secret generic orin-secrets \
  --from-literal=JWT_SECRET="$(openssl rand -hex 48)"
```

Register the app with Argo CD:

```bash
kubectl apply -f argocd/application.yaml
# UI
kubectl -n argocd port-forward svc/argocd-server 8081:443
# admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

If the repo is private, add it in Argo CD (Settings > Repositories) with a GitHub token.

## 6. Verify end to end

1. Push a commit to `main`.
2. Actions tab: all jobs green. Download the `sast-report`, `dependency-reports` and `dast-report` artifacts.
3. A bot commit "ci: deploy abc1234" appears, changing `k8s/kustomization.yaml`.
4. Argo CD UI: app `orin` goes OutOfSync, then Synced and Healthy.
5. `kubectl -n orin get pods` shows server, client and mongo running with the new image tag.

## Tuning

- **Failing the build:** SAST fails on Semgrep ERROR findings, dependency scan on HIGH/CRITICAL fixable CVEs, image scan on CRITICAL. Loosen with `severity` or `exit-code: "0"` while you triage.
- **DAST strictness:** `-I` makes ZAP warnings non-blocking. Remove it to fail on warnings.
- **Scaling the server:** more than one replica needs sticky sessions plus a Socket.IO Redis adapter.
- **Production DB:** use MongoDB Atlas and delete `k8s/mongo.yaml`.
- **Secrets at scale:** use Sealed Secrets or External Secrets instead of `kubectl create secret`.
