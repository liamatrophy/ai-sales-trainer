# Cloud Deployment Guide

## Prerequisites
- Google Cloud project with billing enabled
- `gcloud` CLI installed and authenticated

---

## Step 1: Create the Secret in Secret Manager

```bash
# Enable Secret Manager API
gcloud services enable secretmanager.googleapis.com

# Create the secret (replace YOUR_API_KEY with your actual key)
echo -n "YOUR_API_KEY" | gcloud secrets create GEMINI_API_KEY --data-file=-

# Or if you already have a key file:
gcloud secrets create GEMINI_API_KEY --data-file=path/to/keyfile.txt
```

---

## Step 2: Grant Cloud Build Access to Secret

```bash
# Get your project number
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format='value(projectNumber)')

# Grant Cloud Build access to the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## Step 3: Enable Required APIs

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com
```

---

## Step 4: Grant Cloud Build Permission to Deploy

```bash
# Grant Cloud Run Admin role
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

# Grant Service Account User role
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

---

## Step 5: Deploy!

### Option A: Manual Deploy
```bash
cd "c:\Users\MGamal\Documents\AI SALES TRAINER"
gcloud builds submit --config=cloudbuild.yaml
```

### Option B: Connect to GitHub (Recommended)
1. Go to [Cloud Build Triggers](https://console.cloud.google.com/cloud-build/triggers)
2. Click **Create Trigger**
3. Connect your GitHub repository
4. Set trigger to run on push to `main` branch
5. Select **Cloud Build configuration file** → `cloudbuild.yaml`

---

## After Deployment

Your app will be available at:
```
https://ai-sales-trainer-XXXXXX-uc.a.run.app
```

Find the exact URL:
```bash
gcloud run services describe ai-sales-trainer --region=us-central1 --format='value(status.url)'
```

---

## Updating the API Key

```bash
# Update the secret value
echo -n "NEW_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Redeploy to pick up the new key
gcloud builds submit --config=cloudbuild.yaml
```
