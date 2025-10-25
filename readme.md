# inCharge website hosted on CloudFlare

- The development environment requires:
    - Bash
    - Node
    - VScode
    - Wrangler to run & test the website locally and deploy to CloudFlare
- Uses a CloudFlare worker to process a contact form and send an email

```
# Clone the repository
git clone git@github.com:incharge/cloudflare.git
cd cloudflare

# Install the required Node packages
npm install

# Launch the website on a local dev server
npm run dev

# Deploy the website to CloudFlare
npm run deploy
```

# Configure VScode
If this repository is added to an existing VScode workspace (i.e. it is not the root of a VScode workspace) then explicitly add it using `File` > `Add folder to workspace`. This makes the project's pre-defined debug configurations available in the `Run and Debug' panel.

# Dev site
Note: The dev site is not rate limited  
URL: https://incharge.github-com.workers.dev/

# Debugging
To debug
- Start the local dev server with `npm run dev`
- Start the `Launch index.html` configuration to debug the client-side.
- Start the `Attach to Wrangler` configuration to debug the server-side.
See Debugging Cloudflare https://blog.cloudflare.com/debugging-cloudflare-workers/

# Troubleshooting
Error: 43778 Cloudflare Turnstile Could not find widget  
This error occurrs when the page is debugged as a file, rather than served by a web server, because Turnstile fails to initialise.

When debugging index.html with the production turnstile site key, the turnstile widget sometimes fails to initialise, and shows the message `Stuck here?`.  Try using a test site key.

# Testing
To override Turnstile, find the `cf-turnstile` element in index.html and change the `data-sitekey` value e.g. to `1x00000000000000000000AA` to always pass. For other test site keys see https://developers.cloudflare.com/turnstile/troubleshooting/testing/

# Production site
URL: https://incharge.co.uk/

The contact form is submitted to https://incharge.co.uk/api/contact  
- Requesting this URL with a GET returns `Not Found`.
- Requesting this URL more than once in a 10 second period results in `Error 1015: You are being rate limited`
