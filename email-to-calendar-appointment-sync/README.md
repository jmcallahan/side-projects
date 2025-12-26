# Gmail Automation Suite

**AI-Generated Script** | Human-prompted automation for syncing Gmail appointment emails to Google Calendar with automatic scheduling, link updates, and red color-coding for visibility. Claude AI was used for the script.
Complete automation for your Gmail and Google Calendar.

## Context

This automation was built to solve a specific personal workflow problem. The script was AI-generated (Claude) based on requirements I provided. It demonstrates effective use of automation tools and APIs to eliminate manual tasks, which is increasingly relevant in modern IT/security work where scripting and automation augment core security skills.


## 📦 What's Included

### 1. **Unified Appointment Sync** (`UnifiedAppointmentSync.js`)
   - Syncs VA Video Connect, VR&E, and LifeStance appointments to Google Calendar
   - All appointments colored **RED** for visibility
   - Zero duplicates with fingerprint-based deduplication
   - Auto-updates when links arrive (VA day-of, LifeStance 30-min prior)

### 2. **Unsubscribe Cleanup** (`UnsubscribeCleanup.js`) [BONUS]
   - Auto-trashes emails labeled "Unsubscribe"
   - Silent operation - no error spam
   - Optional: Auto-trash specific senders

## 🚀 Quick Start

### Option A: Unified Script (Recommended)

Deploy **both** scripts in a **single** Apps Script project:

1. Go to https://script.google.com
2. Click **"New project"**
3. **File** → **New** → **Script file** → Name it `AppointmentSync`
4. Paste contents of `UnifiedAppointmentSync.js`
5. **File** → **New** → **Script file** → Name it `UnsubscribeCleanup`
6. Paste contents of `UnsubscribeCleanup.js`
7. Save the project (💾) - Name it `Gmail Automation`

### Option B: Separate Scripts

Deploy each script in its own project if you prefer separation.

## ⚙️ Configuration

### Appointment Sync Trigger

1. Click **⏰ Triggers** (left sidebar)
2. Click **+ Add Trigger**
3. Settings:
   - Function: `syncAllAppointments`
   - Event source: `Time-driven`
   - Type: `Day timer`
   - Time: `4am to 5am` (runs daily)
4. Save

### Unsubscribe Cleanup Trigger

1. Click **+ Add Trigger** (add a second trigger)
2. Settings:
   - Function: `autoCleanUnsubscribes`
   - Event source: `Time-driven`
   - Type: `Day timer`
   - Time: `6am to 7am` (runs daily, after appointment sync)
3. Save

## 🧪 Testing

### Test Appointment Sync
```
1. In Apps Script editor, select: syncAllAppointments
2. Click ▶️ Run
3. Check Execution log (View → Logs)
4. Verify RED appointments appear in Google Calendar
```

### Test Unsubscribe Cleanup
```
1. Create/apply "Unsubscribe" label to a test email
2. Select: autoCleanUnsubscribes
3. Click ▶️ Run
4. Check that labeled email was trashed
```

## 🎨 Customization

### Change Appointment Colors

In each `sync*Appointments()` function:
```javascript
event.setColor(CalendarApp.EventColor.RED);
```

Available colors:
- `RED` (current)
- `ORANGE`
- `YELLOW`
- `GREEN`
- `BLUE`
- `PURPLE`
- `GRAY`

### Adjust Appointment Duration

**VA (default 30 min):**
```javascript
const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
```

**LifeStance (default 60 min):**
```javascript
const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
```

**VR&E:** Duration extracted from email automatically

### Change Email Search Window

Default is last 30 days. To adjust:
```javascript
// Change all instances of:
newer_than:30d

// To:
newer_than:14d  // 2 weeks
newer_than:60d  // 2 months
```

### Auto-Trash Specific Senders

In `UnsubscribeCleanup.js`, find this section:
```javascript
const SENDERS_TO_TRASH = [
  // Add unwanted senders here
  'marketing@company.com',
  'newsletter@example.com'
];
```

Then create a trigger for `autoTrashSpecificSenders`.

## 📊 Monitoring

### View Execution History
1. In Apps Script: **⏰ Triggers** → Click on trigger → **Executions**
2. Shows every run with success/failure status
3. Click any execution to see detailed logs

### Common Log Messages

**Appointment Sync:**
```
[VA] Found 3 email threads
[VA] ✅ Created event: TRADER at Mon Jan 13 2026...
[VRE] ✓ Event exists: LAKIA SMITH at Tue Dec 10 2025...
[LifeStance] ✏️ Updated event with check-in link
```

**Unsubscribe Cleanup:**
```
✓ No emails to clean with label "Unsubscribe"
🧹 Cleaning 5 threads with label "Unsubscribe"
✅ Successfully trashed 5 email threads
```

## 🐛 Troubleshooting

### Problem: No appointments created

**Check:**
1. Do emails exist in last 30 days?
2. Run script manually and check logs for `⚠️` warnings
3. Verify sender addresses match exactly:
   - VA: `Video.Appointment@va.gov`
   - VR&E: `eva@va.gov`
   - LifeStance: `registration@phreesia-mail.com`

**Fix:**
- Search Gmail for `from:Video.Appointment@va.gov newer_than:30d`
- If found, check date format in email matches expected pattern

### Problem: Getting duplicate appointments

**Cause:** Old appointments created before fingerprinting

**Fix:**
1. Delete all old appointment duplicates from calendar
2. Run script manually - it will recreate with fingerprints
3. Future runs will prevent duplicates

### Problem: Daily error emails from Apps Script

**Cause:** Script hitting quota limits or timeout

**Fix:**
1. Reduce email search window: `newer_than:14d`
2. Reduce `MAX_THREADS` in scripts (currently 50-100)
3. Check trigger isn't firing too frequently (should be daily)

### Problem: Wrong timezone on appointments

**Fix:**
1. Apps Script → **⚙️ Project Settings**
2. Set timezone to `America/Chicago` (or your timezone)
3. Delete existing appointments and re-run script

### Problem: Unsubscribe cleanup sending error emails

**Fix:**
1. Ensure "Unsubscribe" label exists in Gmail
2. Check trigger frequency (should be daily, not every minute)
3. Updated script includes error handling - re-paste code if needed

## 📝 How It Works

### Appointment Deduplication

Each appointment gets a unique fingerprint:
```
VA:TRADER:2026-01-13T15:30:00.000Z
```

Components:
- Type: `VA`, `VRE`, or `LIFESTANCE`
- Provider: Name extracted from email
- DateTime: ISO timestamp of appointment

The fingerprint is stored as HTML comment in event description:
```html
<!-- FINGERPRINT:VA:TRADER:2026-01-13T15:30:00.000Z -->
```

**Result:** 5 reminder emails from VA = 1 calendar event

### Link Updates

Script checks existing events and updates them when:
- VA sends day-of email with video link
- LifeStance sends check-in email 30 min before

### Search Efficiency

Uses Gmail search operators:
```
from:sender@domain.com subject:"keyword" newer_than:30d
```

This is **fast** because Gmail indexes these queries.

## 🎯 Best Practices

1. **Let it run for a week** before making changes
2. **Check logs weekly** to catch issues early
3. **Keep search window at 30 days** for good balance
4. **Don't over-trigger** - daily is sufficient
5. **Backup calendar** before first run (just in case)

## 💪 Advanced: Manual Runs

You can manually sync appointments anytime:

1. Open Apps Script
2. Select function dropdown: `syncAllAppointments`
3. Click ▶️ Run
4. Check logs and calendar

Useful when:
- You just received new appointment email
- Want immediate sync instead of waiting for daily trigger

## 🔒 Privacy & Security

**What the script can access:**
- Read your Gmail messages
- Create/modify Google Calendar events
- These scripts run in YOUR Google account, under YOUR ownership

**What it cannot do:**
- Send emails on your behalf
- Share your data externally
- Access data outside your account

**To revoke access:**
1. https://myaccount.google.com/permissions
2. Find "Gmail Automation"
3. Click → Remove Access

## 📚 Additional Resources

- [Apps Script Documentation](https://developers.google.com/apps-script)
- [Gmail Search Operators](https://support.google.com/mail/answer/7190)
- [Calendar API Reference](https://developers.google.com/apps-script/reference/calendar)

---

**Created:** December 2025  
**Maintained for:** Jason Callahan  
**Purpose:** Mission-focused automation, zero bullshit
