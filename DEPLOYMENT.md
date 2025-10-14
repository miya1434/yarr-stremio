# How to Get YARR! Running

So you want to host YARR! yourself? Awesome. Here’s how you can do it. We’ve tried to make it as painless as possible.

---

## The Easy Way: Docker

This is the way to go for most people. It’s clean, simple, and keeps everything contained.

First, make sure you have Docker installed. Then, just pop this into your terminal:

```bash
docker run -d \
  --name yarr \
  -p 58827:58827 \
  spookyhost1/yarr-stremio:latest
```

That's it. YARR! is now running. To configure it, just open your browser and go to `http://localhost:58827/configure`.

## The Slightly Fancier Way: Docker Compose

If you like using `docker-compose.yml` files to manage your stuff, here’s a setup for you.

Create a `docker-compose.yml` file and paste this in:

```yaml
version: '3.8'
services:
  yarr:
    image: spookyhost1/yarr-stremio:latest
    container_name: yarr
    ports:
      - "58827:58827"
    restart: unless-stopped
```

Save it, then run `docker-compose up -d` in the same directory. Done.

---

## For the Devs: Running from Source

If you want to tinker with the code or just prefer running things with Node.js, here's how.

You'll need **Node.js (version 18 or newer)**, **pnpm**, and **TypeScript**.

```bash
# Clone the repository
git clone https://github.com/spookyhost1/yarr-stremio.git
cd yarr-stremio

# Install pnpm and TypeScript globally (if you don't have them)
npm install -g pnpm typescript

# Install all the things
pnpm install

# Build it for production
pnpm build

# And run it!
pnpm start
```

It'll be running on `http://localhost:58827`.

---

## Putting it on the Cloud

You can host YARR! on services like Railway, Heroku, or any other platform that supports Node.js or Docker.

**The general steps are:**

1.  **Fork this GitHub repo.**
2.  **Connect your account** on the hosting platform (like Railway) to your GitHub.
3.  **Point it to your forked repo.**
4.  **Set the necessary environment variables.** The main one you might need is `PORT`, which should be `58827` unless the platform assigns one for you.
5.  **Deploy!**

Most platforms have a free tier that should be more than enough to run YARR!.

---

## Using a Reverse Proxy (Optional)

If you want to access YARR! through a nice domain name (like `yarr.my-cool-domain.com`) instead of an IP address and port, you can use a reverse proxy. It also lets you add HTTPS for free, which is pretty neat.

Here are a couple of examples.

### Nginx

```nginx
server {
    listen 80;
    server_name yarr.your-domain.com;

    location / {
        proxy_pass http://localhost:58827;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        # The other proxy headers are good too, but this is the basic setup
    }
}
```

### Caddy

Caddy is awesome because it handles HTTPS for you automatically.

```
yarr.your-domain.com {
    reverse_proxy localhost:58827
}
```

---

## A Note on Configuration

Pretty much everything can be configured from the web interface. You don't *need* to mess with environment variables unless you want to set a different port or pre-configure things like a Zilean or Prowlarr URL.

If you do want to use them, you can check the `env.example` file to see what's available.

---

Got questions or run into trouble? Feel free to [open an issue on GitHub](https://github.com/spookyhost1/yarr-stremio/issues).

