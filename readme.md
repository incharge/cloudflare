# Web Contact form for CloudFlare

Use a CloudFlare worker to process a contact form and send an email.
Note that this website uses Cloudflare Workers, not the older Cloudflare Pages.

✅ Secure - API keys hidden in Cloudflare Worker secrets  
✅ Spam Protection - Cloudflare Turnstile CAPTCHA  
✅ Email Delivery - Uses Resend API for reliable email sending  
✅ Input Validation - Both client and server-side validation  
✅ Error Handling - Comprehensive error messages and logging  

You will need
- A Cloudflare account - the free tier is sufficient
    - A Cloudflare Turnstile widget
    - Cloudflare DNS configuration. See https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/
- A Resend account - the free tier allows 100 emails per day. For Resend account setup instructions, see https://developers.cloudflare.com/workers/tutorials/send-emails-with-resend/

The development environment requires:  
    - Bash  
    - Node  
    - VScode  
    - Wrangler will be installed to run & test the website locally and deploy to CloudFlare  

```
# Clone the repository
git clone git@github.com:incharge/cloudflare.git
cd cloudflare

# Install the required Node packages
npm install

# Update Wrangler
npm i -D wrangler@latest

# Launch the website on a local dev server
npm run dev

# Deploy the website to CloudFlare
npm run deploy
```

# Configure Turnstile
Find the `cf-turnstile` element in index.html and change the `data-sitekey` value to your own Turnstile site key.
```
<div class="cf-turnstile" data-sitekey="YOUR_TURNSTILE_SITE_KEY"></div>
```
Alternatively, for use a test site key e.g. `1x00000000000000000000AA` to always pass. For other test site keys see https://developers.cloudflare.com/turnstile/troubleshooting/testing/

# Configure Secrets
Copy the `.dev.vars.example` file to `.dev.vars` and fill in the variable values. The .dev.vars file is not stored in git. Set `FROM_EMAIL` to `onboarding@resend.dev` unless you have verified a domain in Resend.
Set the variables in the Cloudflare dashboard. See https://developers.cloudflare.com/workers/configuration/environment-variables/

# Configure Cloudflare rate limiting
Optionally, a URL can be rate-limited. On the free tier, the only option is one request per 10 seconds, with a 10 seciond suspension if exceeded. Paid tiers allow the number of requests and duration to be configured.
https://developers.cloudflare.com/waf/rate-limiting-rules/create-zone-dashboard/

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

# Production site
URL: https://incharge.co.uk/

The contact form is submitted to https://incharge.co.uk/api/contact  
- Requesting this URL with a GET returns `Not Found`.
- Requesting this URL more than once in a 10 second period results in `Error 1015: You are being rate limited`

