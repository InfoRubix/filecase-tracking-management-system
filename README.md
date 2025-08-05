# File Case Management System

A comprehensive web-based file case management and tracking system built with Next.js, using Google Sheets as the database via Google Apps Script.

## Features

### Public User Features
- **File Search**: Search for files using reference file numbers, client names, or barcodes
- **Multiple Search Types**: Intelligent search that handles exact matches, partial matches, and client-based searches
- **File Status Display**: Automatic status calculation based on file age:
  - **Active**: 0-7 years old (Green)
  - **Inactive**: 7-10 years old (Yellow/Red)  
  - **Archive**: 10+ years old (Red)
- **Comprehensive File Details**: View complete file information including:
  - Client details (name, phone number)
  - File location and current status
  - Category, type, and bank information
  - Physical storage location (rack, kotak)
  - Barcode and reference numbers
  - Safekeeping and agent details
- **Multi-File Results**: Navigate through multiple files for same client
- **No Login Required**: Users can search files without authentication

### Admin Features
- **Secure Authentication**: Cookie-based admin login system
- **Responsive Design**: Mobile-optimized interface with hamburger menus for all admin pages
- **Dashboard**: Overview with statistics and recent activity
- **File Management**: Complete CRUD operations for file cases
  - Create new files with auto-generated IDs
  - Edit file details and locations
  - Delete files with confirmation
  - Bulk operations and filtering
- **Rack & Box Management**: Enhanced physical storage management
  - Create and manage racks with loading indicators
  - Add storage boxes (kotak) with auto-generated sequential IDs
  - **Quick Actions Dropdown Menu**: Streamlined interface for rack operations
    - Add New Rack
    - Add Box to Rack
    - Create New Box
  - **Multiple Delete Options**: Flexible box management
    - Remove box from specific rack only
    - Delete box permanently from entire system
  - **Unused Box Management**: Dedicated interface for orphaned boxes
    - Expandable section showing boxes without racks or files
    - One-click cleanup for unused boxes
    - Smart detection of truly orphaned boxes
  - Track quantity and file counts per storage unit
  - Delete racks and boxes with safety checks and loading states
  - Real-time visual feedback during operations
  - **Mobile-Optimized**: Delete buttons always visible on mobile devices
- **Advanced Search & Filtering**: Multi-criteria search with status filters
- **Location Management**: Update file locations (Warehouse, HQ, Bank, Client, Court)
- **Audit Trail**: Automatic logging of all changes with timestamps and user tracking

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Cookie-based Authentication
- **Database**: Google Sheets via Google Apps Script (3 sheets: FILECASE, RACK_LOOKUP, LOG)
- **Icons**: Heroicons
- **Deployment**: Static export ready for any hosting platform

## Database Structure

### FILECASE Sheet (Main file records)
| Field | Description |
|-------|-------------|
| ID | Auto-generated unique identifier (ID001, ID002...) |
| YEAR | File year (used for status calculation) |
| CATEGORY | File category/type |
| TYPE | Document type |
| KOTAK | Storage box number |
| REF FILE | Reference file number (primary search key) |
| CLIENT NAME | Client name (searchable) |
| NO. PHONE CLIENT | Client phone number |
| BARCODE NO | Barcode identifier (searchable) |
| SAFEKEEPING | Safekeeping status (always TRUE for new files) |
| AGENT DETAILS | Agent information |
| PIC | Person in charge |
| BANK | Bank information |
| LOCATION | Current location (Warehouse/HQ/Bank/Client/Court) |

### RACK_LOOKUP Sheet (Physical storage management)
| Field | Description |
|-------|-------------|
| ID | Auto-generated sequential ID (IDK001, IDK002...) |
| KOTAK | Storage box/container name (user-defined) |
| RACK | Rack number |
| QTY | Quantity/capacity of the storage unit |

### LOG Sheet (Audit trail)
| Field | Description |
|-------|-------------|
| ID | Auto-generated log entry ID |
| TIMESTAMP | Date and time of action (Asia/Kuala_Lumpur timezone) |
| REF FILE | Reference to affected file |
| ACTIVITY | Description of action performed |
| LOCATION | Location context |
| UPDATE BY | User who performed the action |

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FileCaseManagement
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Google Apps Script URL
   ```

4. **Configure Google Apps Script**
   - Deploy the `google-apps-script-final.js` file to Google Apps Script
   - Update the `SPREADSHEET_ID` with your Google Sheets ID
   - Set up your Google Sheets with the required structure (FILECASE, RACK_LOOKUP, LOG)

5. **Run development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Public search: http://localhost:3000
   - Admin dashboard: http://localhost:3000/admin/dashboard
   - Admin login: http://localhost:3000/admin

## Default Admin Credentials

- **Email**: admin@filecase.com
- **Password**: admin123

⚠️ **Important**: Change these credentials in the Google Apps Script before deploying to production.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Key Features Implemented

### UI/UX Enhancements (Latest Updates)
- **Quick Actions Dropdown**: Replaced 3 separate buttons with attractive dropdown menu
  - Gradient purple-to-blue design with hover effects
  - Icon-based items with descriptions
  - Smooth animations and transitions
  - Mobile-responsive positioning
- **Loading States**: Real-time feedback for all operations
  - Spinning indicators during delete operations
  - Button disabling to prevent duplicate requests
  - Individual loading states for each rack/box
- **Mobile Optimization**: Complete responsive design
  - Hamburger menus for navigation
  - Touch-friendly interface elements
  - Consistent header layouts across all admin pages
  - "Developed by RUBIX TECHNOLOGY" branding

### Automatic ID Generation
- **File IDs**: Auto-generated sequential IDs (ID001, ID002, ID003...)
- **Storage IDs**: Auto-generated sequential IDs for storage units (IDK001, IDK002, IDK003...)
- **Duplicate Prevention**: Robust ID generation prevents duplicate IDs across all operations

### Intelligent Search System
- **Multi-Type Search**: Handles reference files, client names, and barcodes
- **Exact Match Priority**: Prioritizes exact matches for faster results
- **Client-Based Search**: Returns all files for a specific client
- **Partial Match Fallback**: Handles partial matches when exact matches fail
- **Hydration-Safe**: Fixed SSR/client mismatches for development mode

### Status Management
- **Automatic Status Calculation**: Based on file year vs current year
- **Visual Indicators**: Color-coded status badges (Green/Yellow/Red)
- **Consistent Logic**: Same status calculation across all pages

### Physical Storage Management
- **Rack Management**: Create and manage physical storage racks with loading indicators
- **Box/Kotak Management**: User-defined storage container names with auto-generated IDs
- **Quick Actions Interface**: Dropdown menu for streamlined operations
  - Gradient design with hover effects
  - Icon-based navigation with descriptions
  - Single-click access to all rack operations
- **Advanced Delete Operations**: Multiple deletion options with clear visual distinction
  - **Orange button**: Remove box from specific rack only
  - **Red button**: Delete box permanently from entire system
  - Individual loading states for each operation
- **Unused Box Cleanup**: Dedicated management for orphaned boxes
  - Expandable rack-style interface
  - Smart detection of boxes with no racks and no files
  - One-click permanent deletion for cleanup
  - Orange color scheme for clear identification
- **Capacity Tracking**: Track quantity and file counts per storage unit
- **Safety Features**: Confirmation dialogs for deletions with loading states
- **Real-time Feedback**: Loading spinners during delete operations
- **Mobile Responsive**: Touch-friendly interface with always-visible delete buttons

## Recent Updates & Improvements

- ✅ **Enhanced UI/UX**: Replaced 3 separate action buttons with attractive dropdown menu
- ✅ **Advanced Delete System**: Multiple delete options with visual distinction
  - Remove from rack vs permanent deletion
  - Color-coded buttons (orange/red) for clear user understanding
  - Individual loading states for each operation type
- ✅ **Unused Box Management**: Dedicated cleanup interface
  - Smart detection algorithm for orphaned boxes
  - Expandable rack-style section with arrow navigation
  - One-click cleanup for boxes without racks or files
- ✅ **Loading States**: Added spinner animations for all delete operations  
- ✅ **Mobile Responsive**: Complete mobile optimization with always-visible delete buttons
- ✅ **Consistent Branding**: Unified header layouts with RUBIX TECHNOLOGY branding
- ✅ **Performance**: Fixed hydration mismatches for better development experience
- ✅ **User Experience**: Improved button positioning and visual feedback

## Security Features

- **Cookie-based Authentication**: Secure admin session management
- **Input Validation**: Server-side validation for all inputs
- **Audit Logging**: Complete trail of all administrative actions
- **Role-based Access**: Public search vs admin-only management functions

---

## License & Terms

This software is proprietary to RUBIX TECHNOLOGY. Unauthorized reproduction, distribution, or modification is prohibited. For licensing inquiries, please contact RUBIX TECHNOLOGY directly.

---

**© 2025 RUBIX TECHNOLOGY. All right reserved.**