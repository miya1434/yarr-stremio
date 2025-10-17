# YARR! 

<div align="center">
  <img src="https://spooky.host/yarrwhite.png" alt="YARR! Logo" width="200"/>
</div>

<p align="center">
  <strong>Yet Another Rapid Retriever</strong> - A free, open-source Stremio addon with 60+ torrent sources, smart ranking, and instant debrid streaming. Quick 5-step setup.
</p>

---

## What is it?

YARR! is a Stremio addon that acts as your personal pirate crew, fetching torrents from all corners of the internet. It integrates with debrid services to give you instant, high-speed streaming, and it's smart enough to find the best quality links for whatever you're watching. It's built to be simple, fast, and completely customizable.

## Features

- **Tons of Sources**: We're talking 60+ public trackers, anime sites, and international indexers.
- **Zilean Integration**: Get instant results from a massive, free torrent database.
- **Indexer Support**: Plug in Prowlarr or Jackett to access over 1000 more trackers.
- **Debrid Power**: Works with RealDebrid, Premiumize, AllDebrid, DebridLink, TorBox, and PikPak. If a torrent is cached, you stream it instantly.
- **Plays Well with Others**: Combine results from other Stremio addons like Torrentio or MediaFusion.
- **Smart Filtering**: Prioritize languages, and block qualities you don't want (like CAM, HDR, HEVC, etc.).
- **Stremio Sync**: Configure on the web and sync it straight to your Stremio account.
- **Clean & Easy Setup**: A simple 5-step wizard to get you going in minutes.

---

## Setup Walkthrough

Getting started is super easy. Here's a quick look at the setup process.

**Want to see everything at once?** Check out the full setup flow:
- [Light Mode Full Setup](https://spooky.host/yarr/whiteversionfull.png)
- [Dark Mode Full Setup](https://spooky.host/yarr/darkversionfull.png)

### Step 1: Welcome Aboard, Matey!

This is the first thing you'll see. Just hit "Begin Setup" to get started.

![Step 1](https://spooky.host/yarr/1.png)

### Step 2: Choose Your Speed

Decide how fast you want your results. "Balanced" is a good mix of speed and coverage, but if you're feeling impatient, "Fast" is your friend. If you want to search *everything*, go "Comprehensive".

![Step 2](https://spooky.host/yarr/2.png)

### Step 3: Pick Your Content & Sources

This is where you tell YARR! what to look for. You can use the recommended "Fast Indexers" like Zilean for instant results.

**Normal Mode:**
Just pick your content type, select your languages, and you're good to go. The recommended sources are already enabled.

![Step 3 Normal](https://spooky.host/yarr/3normal.png)

**Manual Mode:**
Want more control? Flick the "Manually Select Sources" switch to pick and choose from all the available trackers.

![Step 3 Manual](https://spooky.host/yarr/3manual.png)

### Step 4: Quality & Debrid

Here you can link your debrid services. Just paste in your API key and test it. YARR! will check all the services you enable. You can also set your preferred quality levels and choose a display style.

![Step 4](https://spooky.host/yarr/4.png)

### Step 5: Advanced Options

Fine-tune your experience. Block certain video qualities, remove adult content, or even aggregate results from other addons. We recommend trying out ElfHosted's addon collection if you're into that.

![Step 5](https://spooky.host/yarr/5.png)

### Step 6: You're All Set!

That's it! You can now install the addon to Stremio. You've got two options here:

**Option 1: Auto-Sync (Easiest)**
If you're signed into Stremio on the web, you can connect your account and the addon will automatically sync to all your devices. No manual installation needed.

![Step 6 Not Signed In](https://spooky.host/yarr/6notsignedin.png)

**Option 2: Manual Install**
Click "Install to Stremio" and it'll open the Stremio app. Just confirm the installation and you're good to go.

![Manual Install](https://spooky.host/yarr/install.png)

**Once you're set up:**
You'll see a confirmation. You can also manage your addons' priority directly from here.

![Step 6 Done](https://spooky.host/yarr/6.png)

**Manage Your Addons:**
Easily re-order your addons to make sure YARR! is at the top for the best results.

![Manage Addons](https://spooky.host/yarr/6manage.png)

### Managing Your Addon

Once YARR! is configured and installed, you can easily manage it anytime. Just head back to the configuration page and you'll be able to:

- **Reorder your addons**: Drag and drop to change priority. Put YARR! at the top to make sure it's checked first.
- **Update your settings**: Change debrid services, adjust quality filters, or enable new sources.
- **Sync across devices**: If you're signed into Stremio, your addon configuration syncs automatically to all your devices.
- **Test your setup**: Use the "Test Configuration" button to make sure everything's working before you start streaming.

It's all designed to be dead simple. No config files, no command line nonsense. Just click, adjust, and you're done.

---

## The Result

After setting everything up, you'll get beautifully formatted results in Stremio, packed with all the info you need.

###WARNING###
Donot use the connect to Stremio button, it will break your stremio account permanently

![Detailed View](https://spooky.host/yarr/detailed.png)

---

## FAQ

**Do I need a debrid service?**
Nope. It works perfectly fine with regular magnet links for P2P streaming. Debrid just makes it faster by streaming from their servers if the file is cached.

**Can I use more than one debrid service?**
Yep! Add as many as you have. YARR! will check all of them.

**What's Zilean?**
A free, public torrent database that gives you instant search results. It's awesome, you should definitely use it.

**Does this thing track me?**
No way. Zero tracking, zero analytics. It's your server, your business.

**Installation fails with native module errors?**
```bash
# Use the clean install method
pnpm install --ignore-scripts
pnpm rebuild
pnpm build
```

**Proxy not working?**
Make sure your `.env` file has the correct proxy URL format:
```bash
PROXY_URL=http://username:password@proxy-host:port
```

**Live TV not showing?**
1. Enable "Live TV" in the configuration page
2. Save settings
3. Refresh Stremio

---

### 🐳 Docker Install

**Option 1: One-Click Install**
```bash
# Using Docker Compose
curl -sSL https://raw.githubusercontent.com/spookyhost1/yarr-stremio/main/install.sh | bash -s -- docker
```

**Option 2: Docker Hub (Latest)**
```bash
# Pull and run the latest image
docker run -d \
  --name yarr \
  -p 58827:58827 \
  yarrhoster/yarr-stremio:latest
```

**Option 3: Docker Compose**
```yaml
version: '3.8'
services:
  yarr:
    image: yarrhoster/yarr-stremio:latest
    container_name: yarr
    ports:
      - "58827:58827"
    restart: unless-stopped
```

## Deployment

Check out [DEPLOYMENT.md](DEPLOYMENT.md) for all the different ways you can get YARR! running.

## License

It's open-source, under the MIT License. See the [LICENSE](LICENSE) file for the boring legal stuff.

<div align="center">
  <strong>Made with 🏴‍☠️</strong>
</div>

