# Deploy to Cloudflare Pages

This project is a static site and is ready for Cloudflare Pages deployment.

## 1) Pre-deploy checklist

- Confirm static entry file is `index.html`.
- Confirm assets use relative paths (`style.css`, `index.js`).
- Confirm `_headers` and `_redirects` exist.
- Confirm `404.html` exists.

## 2) Deploy from Cloudflare Dashboard (recommended)

1. Push this folder to a GitHub repository.
2. Open Cloudflare Dashboard -> Workers & Pages -> Create application -> Pages.
3. Choose Connect to Git.
4. Select your repository.
5. Build settings:
   - Framework preset: `None`
   - Build command: (leave empty)
   - Build output directory: `/`
6. Click Save and Deploy.

## 3) Deploy with Wrangler CLI (optional)

Run in project root:

```bash
npm install -g wrangler
wrangler login
wrangler pages project create pwm-interactive-demo
wrangler pages deploy . --project-name=pwm-interactive-demo
```

## 4) Bind custom domain (optional)

1. Open your Pages project -> Custom domains.
2. Add your domain.
3. Follow DNS instructions from Cloudflare.
4. Wait for SSL certificate to be issued.

## 5) Post-deploy validation

- Open homepage and verify controls work.
- Change frequency and confirm x-axis updates.
- Verify LED and motor animation updates in real time.
- Check 404 page by visiting `/not-found-test`.
- Confirm response headers from `_headers` are applied.

## 6) Update workflow

- Git-connected deployment: push commits to the configured branch.
- CLI deployment: run `wrangler pages deploy . --project-name=pwm-interactive-demo`.
