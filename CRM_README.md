# CRM System Documentation

## Overview

A comprehensive CRM (Customer Relationship Management) system has been built for the real estate website. The system includes a dashboard, contact management, deal pipeline, and activity tracking with full dark/light mode support.

## Features Implemented

### 1. **Dashboard** (`/crm`)
- High-level metrics overview:
  - Total Revenue (from closed-won deals)
  - Active Leads (deals in pipeline)
  - Conversion Rate (win rate percentage)
  - Total Deals count
- Interactive charts using Recharts:
  - Bar chart showing deals by stage
  - Pie chart showing deal status distribution
  - Line chart showing top deals revenue

### 2. **Contact Management** (`/crm/contacts`)
- Unified contacts view aggregating data from:
  - Contact messages
  - Open house sign-ins
  - Website signups
- Features:
  - Searchable data table (by name, email, phone)
  - Filterable by source
  - Detailed contact profile view in modal
  - Shows message count and open house attendance

### 3. **Deal Pipeline** (`/crm/deals`)
- Drag-and-drop Kanban board with 5 stages:
  - Lead
  - Qualification
  - Proposal
  - Closed Won
  - Closed Lost
- Features:
  - Create new deals with full details
  - Drag deals between stages
  - View deal value, probability, expected close date
  - Deal notes and metadata

### 4. **Activity Feed Component**
- Chronological timeline of activities:
  - Notes
  - Emails
  - Calls
  - Meetings
  - Tasks
- Shows activity metadata (subject, duration, location)
- Task completion tracking

### 5. **Theme System**
- Linear-style dark/light mode
- Theme toggle component
- Smooth transitions between themes
- System preference detection

## Database Schema

### New Tables Created

1. **`deals`** - Tracks sales deals through pipeline
   - `user_id` for multi-tenancy
   - `contact_id` links to unified contacts
   - `stage` enum (lead, qualification, proposal, closed-won, closed-lost)
   - `value`, `probability`, `expected_close_date`, `notes`

2. **`activities`** - Activity feed entries
   - `user_id` for multi-tenancy
   - `contact_id` and `deal_id` for linking
   - `type` enum (note, email, call, meeting, task)
   - `metadata` JSONB for flexible data storage

3. **`unified_contacts`** (View) - Aggregates contacts from multiple sources
   - Combines data from `contact_messages` and `open_house_sign_ins`
   - Shows first/last name, email, phone
   - Tracks sources and activity counts

### Multi-Tenancy

All tables include:
- `user_id` column referencing `auth.users`
- `created_at` and `updated_at` timestamps
- Row Level Security (RLS) policies ensuring users only see their own data
- Admin override policies for full access

## Setup Instructions

### 1. Apply Database Migration

Run the migration file to create the CRM tables:

```sql
-- File: supabase/migrations/20240320000022_create_crm_tables.sql
```

You can apply this via:
- Supabase Dashboard SQL Editor
- Supabase CLI: `supabase migration up`

### 2. Access the CRM

- Navigate to `/crm` in your browser
- Or click "CRM" in the user profile dropdown menu
- Requires authentication (users will be redirected to `/auth` if not logged in)

## File Structure

```
src/
├── pages/
│   ├── CRMDashboard.tsx      # Main dashboard with metrics
│   ├── CRMContacts.tsx        # Contact management page
│   └── CRMDeals.tsx           # Deal pipeline page
├── components/
│   ├── CRMLayout.tsx          # Shared CRM navigation layout
│   ├── ActivityFeed.tsx      # Activity timeline component
│   └── ThemeToggle.tsx        # Theme switcher component
├── contexts/
│   └── ThemeContext.tsx       # Theme provider and context
└── integrations/supabase/
    └── types.ts               # Updated with CRM table types
```

## Usage

### Creating a Deal

1. Navigate to `/crm/deals`
2. Click "New Deal" button
3. Fill in deal details:
   - Title (required)
   - Value (optional)
   - Stage (defaults to Lead)
   - Probability (0-100%)
   - Expected close date
   - Notes
4. Click "Create Deal"

### Moving Deals Between Stages

1. In the Deal Pipeline (`/crm/deals`)
2. Drag a deal card from one stage column to another
3. The deal stage will update automatically

### Viewing Contacts

1. Navigate to `/crm/contacts`
2. Use the search bar to filter by name, email, or phone
3. Use the source filter dropdown to filter by contact source
4. Click on any contact row to view detailed information

### Viewing Dashboard Metrics

1. Navigate to `/crm`
2. View key metrics at the top
3. Explore interactive charts below

## Theme Customization

The CRM uses a Linear-inspired design with:
- Dark mode: `#0D0D0D` background, `#1A1A1A` cards
- Light mode: `#F9FAFB` background, white cards
- Accent color: `#9b87f5` (purple)

To customize, update the color values in:
- `src/index.css` (CSS variables)
- Individual component files (inline styles)

## Security

- All queries are protected by Row Level Security (RLS)
- Users can only access their own deals and activities
- Admins have read access to all data
- Contact data is aggregated from existing tables (no new write permissions needed)

## Future Enhancements

Potential additions:
- Email integration for activity tracking
- Calendar integration for meetings
- Advanced reporting and analytics
- Export functionality (CSV, PDF)
- Custom deal stages
- Contact tags and segmentation
- Automated workflows

## Notes

- The `unified_contacts` view aggregates data from existing tables
- Activities can be linked to both contacts and deals
- All timestamps are stored in UTC
- The system uses React Query for efficient data fetching and caching
