# PDF Diff Viewer - Deployment Guide

## 🚀 Quick Start

### Prerequisites

- Bun 1.3.2+ or Node.js 20+
- Docker & Docker Compose (for containerized deployment)
- Git

### Local Development

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Open http://localhost:3000
```

### Local Testing

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run linter
bun run lint

# Format code
bun run format
```

---

## 🐳 Docker Deployment

### Development with Docker

```bash
# Start development environment
docker-compose up dev

# Access at http://localhost:3000
```

### Production with Docker

```bash
# Build and start production container
docker-compose up prod

# Access at http://localhost:3001
```

### With Nginx Reverse Proxy

```bash
# Start with nginx
docker-compose --profile with-nginx up

# Access at http://localhost:80
```

### Manual Docker Build

```bash
# Build image
docker build -t pdf-diff-viewer:latest .

# Run container
docker run -p 3000:3000 pdf-diff-viewer:latest
```

---

## ☁️ Cloud Deployment

### AWS ECS (Recommended for Docker)

1. **Build and push image to ECR**

```bash
# Authenticate with ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t pdf-diff-viewer .
docker tag pdf-diff-viewer:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/pdf-diff-viewer:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/pdf-diff-viewer:latest
```

2. **Create ECS Task Definition**

```json
{
  "family": "pdf-diff-viewer",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "pdf-diff-viewer",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/pdf-diff-viewer:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/ || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

3. **Create ECS Service**

```bash
aws ecs create-service \
  --cluster pdf-diff-cluster \
  --service-name pdf-diff-service \
  --task-definition pdf-diff-viewer \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

### Google Cloud Run

```bash
# Build and deploy
gcloud run deploy pdf-diff-viewer \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --port 3000
```

### Azure Container Instances

```bash
# Create resource group
az group create --name pdf-diff-rg --location eastus

# Create container instance
az container create \
  --resource-group pdf-diff-rg \
  --name pdf-diff-viewer \
  --image pdf-diff-viewer:latest \
  --cpu 1 \
  --memory 1 \
  --ports 3000 \
  --dns-name-label pdf-diff \
  --environment-variables NODE_ENV=production
```

### DigitalOcean App Platform (Static - FREE Tier Available)

**Recommended for cost-effective static hosting with free tier**

```bash
# Method 1: Using Web Interface (Easiest)
# 1. Push code to GitHub
# 2. Go to https://cloud.digitalocean.com/apps
# 3. Create App → Select GitHub repository
# 4. Configure:
#    - Build Command: npm install && npm run copy-worker && npm run generate
#    - Output Directory: .output/public
#    - Environment: NODE_ENV=production
# 5. Deploy (takes 3-5 minutes)

# Method 2: Using App Spec File
# The repository includes .do/app.yaml for automated configuration
# Simply create app from GitHub and DigitalOcean will auto-detect the spec

# Method 3: Using doctl CLI
brew install doctl  # or: apt-get install doctl
doctl auth init
doctl apps create --spec .do/app.yaml
```

**Free Tier Benefits:**

- Up to 3 static site apps FREE
- 1 GB transfer/month per app
- SSL certificates included
- Global CDN
- Auto-deploy on git push

**Cost:** $0/month (free tier), additional apps $3/month

### Vercel (Static/SSR)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
bun run generate  # ← Changed from 'build' to 'generate' for static
netlify deploy --prod --dir=.output/public
```

---

## 🔒 Security Configuration

### Environment Variables

```bash
# .env.production
NODE_ENV=production
HOST=0.0.0.0
PORT=3000
```

### Content Security Policy

The nginx.conf includes a production-ready CSP. Customize as needed:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" always;
```

### SSL/TLS Configuration

For production, always use HTTPS. Configure SSL in your load balancer or reverse proxy.

---

## 📊 Monitoring & Health Checks

### Health Check Endpoint

```bash
curl http://localhost:3000/
```

### Docker Health Check

Built into Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD bun run -e 'fetch("http://localhost:3000/").then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))'
```

### Monitoring Recommendations

- **Logs**: Use CloudWatch, Stackdriver, or Application Insights
- **Metrics**: Monitor CPU, memory, request latency
- **Alerts**: Set up alerts for health check failures and errors
- **APM**: Consider Sentry, New Relic, or Datadog

---

## 🔄 CI/CD Pipeline

### GitHub Actions

The project includes a complete CI/CD pipeline (`.github/workflows/ci.yml`):

- ✅ Automated testing on every push/PR
- ✅ Code linting and formatting checks
- ✅ Security scanning with Trivy
- ✅ Docker image building
- ✅ Automated dependency updates via Dependabot

### Deployment Triggers

- **Staging**: Auto-deploy on push to `develop` branch
- **Production**: Auto-deploy on push to `main` branch (configure in workflow)

---

## 🛠 Troubleshooting

### Build Failures

```bash
# Clean build cache
rm -rf .nuxt .output node_modules
bun install
bun run build
```

### Docker Issues

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker build --no-cache -t pdf-diff-viewer .
```

### Memory Issues

If encountering OOM errors, increase container memory:

- **Docker**: Update `docker-compose.yml` memory limits
- **ECS**: Increase task memory in task definition
- **Cloud Run**: Use `--memory 2Gi` flag

### PDF.js Worker Issues

Ensure the worker file is correctly bundled:

```bash
# Check if worker exists after build
ls .output/public/pdf.worker.min.mjs
```

---

## 📈 Performance Optimization

### Production Build

```bash
# Generate optimized build
bun run build

# Analyze bundle size (if configured)
bun run analyze
```

### Caching Strategy

- Static assets cached for 1 year (nginx.conf)
- PDF.js worker bundled locally (no CDN dependency)
- Diff computation offloaded to Web Worker (async, non-blocking UI)
- PDF cache with LRU eviction (max 10 documents, automatic cleanup)
- Console logging disabled in production (development only)

### Scaling Recommendations

- **Horizontal Scaling**: Run multiple instances behind load balancer
- **Auto-scaling**: Configure based on CPU/memory metrics
- **CDN**: Use CloudFront, CloudFlare, or similar for static assets

---

## 🔐 Security Checklist

- ✅ PDF.js worker bundled locally (no CDN dependency)
- ✅ Content Security Policy configured
- ✅ Security headers in nginx.conf
- ✅ Automated dependency scanning (Dependabot + Trivy)
- ✅ Docker image security scanning in CI/CD
- ✅ Non-root user in Docker container
- ✅ Minimal Docker image (Alpine-based)
- ⚠️ Configure HTTPS/SSL in production
- ⚠️ Review and update CSP for your domain
- ⚠️ Set up rate limiting in reverse proxy

---

## 📝 Additional Resources

- [Nuxt 3 Documentation](https://nuxt.com/docs)
- [Bun Documentation](https://bun.sh/docs)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS ECS Guide](https://docs.aws.amazon.com/ecs/)
- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)

---

## 💬 Support

For issues or questions:

1. Check the [README.md](README.md) for feature documentation
2. Review the [GitHub Issues](../../issues) for known problems
3. Open a new issue with detailed reproduction steps
