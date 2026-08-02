# Deploying Treeline to a Vultr host

Domain is `treeline.us.kg` (DigitalPlat), server is the Vultr box at
`216.128.158.218`.

> **DigitalPlat has no DNS record editor.** It registers the name and delegates
> it to *external* authoritative nameservers — that is the whole of its job. All
> A/CNAME/MX records live at whatever DNS service you delegate to. This is why
> Cloudflare gets set up **first**: the DigitalPlat registration form asks for
> nameserver hostnames, so you need them in hand before you can register.

## 1. Cloudflare zone (before registering)

1. Create a free account at <https://dash.cloudflare.com/sign-up>.
2. **Add a site** → enter `treeline.us.kg` → choose the **Free** plan.
3. Cloudflare assigns two nameservers, e.g. `alice.ns.cloudflare.com` and
   `bob.ns.cloudflare.com`. Copy **both**, exactly.

Cloudflare will report the zone as "pending" — expected. It stays pending until
step 2 delegates the domain to it.

## 2. Register at DigitalPlat

In the [dashboard](https://dash.domain.digitalplat.org/): **Register** → label
`treeline`, suffix `.us.kg` → **Check availability** → enter both Cloudflare
nameserver hostnames → submit.

Enter *hostnames*, never an IP. `216.128.158.218` does not belong in the
nameserver field — that comes later, as an A record at Cloudflare.

Then confirm under **Domain List** that it is active, and note the expiration
date. These are free but **not permanent** — they expire and must be renewed
from the dashboard, and renewal windows change. Set a reminder ~30 days out.

Verify delegation before continuing:

```bash
dig NS treeline.us.kg +short
```

You want the two Cloudflare nameservers back. Nothing below works until this
returns them — allow up to a few hours.

## 3. DNS records at Cloudflare

Once the zone goes active, add:

| Type | Name  | Content           | Proxy status  |
|------|-------|-------------------|---------------|
| A    | `@`   | `216.128.158.218` | **DNS only**  |
| A    | `www` | `216.128.158.218` | **DNS only**  |

**Both must be "DNS only" (grey cloud), not proxied (orange).** A proxied record
answers with Cloudflare's IP, and certbot's HTTP-01 challenge in step 5 will fail
against it. Turn proxying on afterwards if you want it.

```bash
dig +short treeline.us.kg     # expect 216.128.158.218
```

## 4. Deploy

Check SSH works first — this is the one thing I could not verify for you, so
confirm the login before running anything that changes the box:

```bash
ssh root@216.128.158.218 'cat /etc/os-release | head -2; whoami'
```

If `root` is not your login, substitute it below. Then:

```bash
cd /Users/max/RSW/colorado-rockies-natives
SSH_TARGET=root@216.128.158.218 DOMAIN=treeline.us.kg ./deploy/deploy.sh
```

The script installs nginx and rsync if missing, uploads the four site files to
`/var/www/treeline`, writes the server block, opens ports 80/443 in ufw, and
reloads nginx. It is idempotent — re-run it for every later deploy.

Port 80 was closed and nothing was serving HTTP when checked, so the first run
does real setup rather than just a file sync. Read it before running it.

Verify:

```bash
curl -I http://treeline.us.kg/
```

## 5. HTTPS

Only once step 4 returns `200 OK` over plain HTTP:

```bash
ssh root@216.128.158.218 'apt-get install -y certbot python3-certbot-nginx \
  && certbot --nginx -d treeline.us.kg -d www.treeline.us.kg'
```

Certbot rewrites the server block for 443, adds a redirect if you accept, and
installs a renewal timer.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `dig NS` returns nothing | Delegation not propagated, or nameservers mistyped at DigitalPlat |
| Cloudflare zone stuck "pending" | Same — the NS records at DigitalPlat do not match the assigned pair |
| `curl` times out | ufw or the Vultr *cloud* firewall still blocking 80/443. The script opens ufw; a firewall group in the Vultr control panel is separate and must be opened there |
| certbot HTTP-01 fails | A record is proxied — set it to DNS only |
| `rsync: command not found` | Remote lacked rsync; the script now installs it, so re-run |

## Rollback

Four static files, and nothing else on the box is touched:

```bash
ssh root@216.128.158.218 'rm -rf /var/www/treeline \
  && rm -f /etc/nginx/sites-enabled/treeline /etc/nginx/sites-available/treeline \
  && nginx -t && systemctl reload nginx'
```

GitHub Pages stays live at <https://matheku.github.io/colorado-rockies-natives/>
regardless — deploying here does not take it down.
