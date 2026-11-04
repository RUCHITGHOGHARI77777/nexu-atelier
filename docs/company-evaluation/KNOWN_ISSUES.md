# 15. KNOWN DEFICIENCIES, HONEST LIMITATIONS & REMEDIATION PLAN

1. **Third-Party APIs in Simulated Demo Mode:**
   - *Limitation:* Razorpay, WhatsApp Cloud API, and Shiprocket operate using production-structured demo adapters.
   - *Remediation:* Production deployment simply requires adding API keys in the deployment environment variables.
2. **Concurrent Dev and Build Webpack Lock:**
   - *Limitation:* Running `npm run build` while `npm run dev` is active in parallel can corrupt cached webpack chunks.
   - *Remediation:* Handled in Release Runbook: always restart dev server after running production builds.
