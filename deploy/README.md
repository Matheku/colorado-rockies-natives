# Deploying Treeline to a Vultr host

Three steps: point the domain, sync the site, then add TLS.

## 1. Domain — `treeline.us.kg`

Register free at [domain.digitalplat.org](https://domain.digitalplat.org/). Then add
two A records in their DNS panel:

| Type | Name  | Value             |
|------|-------|-------------------|
| A    | `@`   | `216.128.158.218` |
| A    | `www` | `216.128.158.218` |

DigitalPlat fronts DNS with Cloudflare. **Leave both records set to "DNS only"
(grey cloud), not proxied.** A proxied record hides the origin, and certbot's
HTTP-01 challenge in step 3 will fail against it. Turn proxying on afterwards if
you want it.

Check propagation before continuing:

```bash
dig +short treeline.us.kg
```

## 2. Deploy

```bash
SSH_TARGET=root@216.128.158.218 DOMAIN=treeline.us.kg ./deploy/deploy.sh
```

Adjust `SSH_TARGET` if your login is not `root`. The script installs nginx if it
is missing, rsyncs the site to `/var/www/treeline`, writes the server block, and
opens ports 80/443 in ufw. It is idempotent — re-run it for every later deploy.

**Note:** port 80 on that host was closed when checked, and nothing was serving
HTTP, so the first run does real setup rather than just a file sync. Read it
before running it.

## 3. TLS

Only once `dig` returns the right IP:

```bash
ssh root@216.128.158.218 'apt-get install -y certbot python3-certbot-nginx \
  && certbot --nginx -d treeline.us.kg -d www.treeline.us.kg'
```

Certbot rewrites the server block for 443 and installs a renewal timer.

## Rollback

The site is six static files and nothing else touches the box:

```bash
ssh root@216.128.158.218 'rm -rf /var/www/treeline \
  && rm -f /etc/nginx/sites-enabled/treeline /etc/nginx/sites-available/treeline \
  && nginx -t && systemctl reload nginx'
```

GitHub Pages stays live at <https://matheku.github.io/colorado-rockies-natives/>
either way — deploying here does not take it down.
