# File Case Management System Setup Guide

## Prerequisites
- Node.js 18+ installed
- Google Account for Google Sheets
- Netlify account (for deployment)

## Google Sheets Setup

### 1. Create Google Spreadsheet
Create a new Google Spreadsheet with 3 sheets:

#### Sheet 1: FILECASE
| ID | KOTAK | NO | RACK | CATEGORY | REF FILE | CLIENT NAME | NO. PHONE CLIENT | BARCODE NO | SAFEKEEPING | AGENT DETAILS | PIC | BANK | STATUS | LOCATION |
|----|-------|----|----|----------|----------|-------------|------------------|------------|-------------|---------------|-----|------|--------|----------|

#### Sheet 2: RACK_LOOKUP
| KOTAK | RACK | CATEGORY |
|-------|------|----------|

#### Sheet 3: LOG
| TIMESTAMP | REF FILE | STATUS | LOCATION | UPDATE BY |
|-----------|----------|--------|----------|-----------|

### 2. Deploy Google Apps Script
1. Open Google Apps Script (script.google.com)
2. Create a new project
3. Copy the contents of `google-apps-script.js` into the script editor
4. Replace `YOUR_SPREADSHEET_ID` with your actual spreadsheet ID
5. Save the project
6. Deploy as web app:
   - Execute as: Me
   - Who has access: Anyone
7. Copy the web app URL

### 3. Update Environment Variables
1. Copy `.env.example` to `.env.local`
2. Replace `YOUR_SCRIPT_ID` with the actual script ID from the web app URL
3. Generate a secure JWT secret key

## Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Access the Application
- User interface: http://localhost:3000
- Admin login: http://localhost:3000/admin

## Default Admin Credentials
- Email: admin@filecase.com
- Password: admin123

**Important**: Change these credentials in the Google Apps Script before deploying to production.

## Netlify Deployment

### 1. Build the Application
```bash
npm run build
```

### 2. Deploy to Netlify
1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify:
   - `NEXT_PUBLIC_GOOGLE_SCRIPT_URL`
   - `JWT_SECRET`
   - `NODE_ENV=production`

### 3. Configure Build Settings
Add the following to your `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Features

### User Features
- Search files by reference number
- View file details including location, status, client information
- No login required for users

### Admin Features
- Secure login system
- View all file cases
- Search and filter files
- Update file status and location
- Automatic logging of changes

## Security Notes
1. Change default admin credentials
2. Use strong JWT secret key
3. Enable HTTPS in production
4. Regularly review Google Apps Script permissions
5. Monitor access logs

## Troubleshooting

### Common Issues
1. **Google Apps Script not accessible**: Check deployment permissions
2. **Authentication issues**: Verify JWT secret configuration
3. **Data not loading**: Check Google Sheets permissions and script URL
4. **Build failures**: Ensure all dependencies are installed

### Support
For issues and questions, please check the application logs and ensure all setup steps are completed correctly.