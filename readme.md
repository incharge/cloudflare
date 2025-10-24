# inCharge website hosted on CloudFlare

- The development environment requires:
    - Bash
    - Node
    - VScode
    - Wrangler to run & test the website locally and deploy to CloudFlare
- Uses a CloudFlare worker to process a contact form and send an email

```
# Launch the website on a local dev server
npm run dev

# Deploy the website to CloudFlare
npm run deploy
```

# Dev site
Note: The dev site is not rate limited  
URL: https://incharge.github-com.workers.dev/

# Production site
URL: https://incharge.co.uk/

The contact form is submitted to https://incharge.co.uk/api/contact  
- Requesting this URL with a GET returns `Not Found`.
- Requesting this URL more than once in a 10 second period results in `Error 1015: You are being rate limited`
