# Unified Appointment Sync - Setup Instructions

## What This Script Does

- **Syncs 3 appointment types:** VA Video Connect, VR&E, and LifeStance
- **All appointments colored RED** for high visibility
- **Zero duplicates:** Uses fingerprinting system based on provider + date/time
- **Auto-updates:** When links become available (VA day-of, LifeStance 30-min before)
- **Only scans last 30 days:** Avoids re-processing old emails

## Setup Steps

### 1. Open Google Apps Script

1. Go to https://script.google.com
2. Click **"New project"**
3. Delete any existing code in the editor

### 2. Add the Script

1. Copy **everything** from `UnifiedAppointmentSync.js`
2. Paste into the Apps Script editor
3. Click the **save icon** (💾) or press `Ctrl+S` / `Cmd+S`
4. Name your project: `Appointment Sync`

### 3. Grant Permissions

1. Click **Run** → Select `syncAllAppointments` from dropdown
2. Click the **▶️ Run** button
3. You'll see "Authorization required" → Click **Review Permissions**
4. Choose your Gmail account
5. Click **Advanced** → **Go to Appointment Sync (unsafe)**
6. Click **Allow**

### 4. Set Up Automatic Trigger

This makes it run daily automatically:

1. Click the **⏰ clock icon** (Triggers) on the left sidebar
2. Click **+ Add Trigger** (bottom right)
3. Configure:
   - **Choose which function to run:** `syncAllAppointments`
   - **Select event source:** `Time-driven`
   - **Select type of time based trigger:** `Day timer`
   - **Select time of day:** `4am to 5am` (or your preference)
4. Click **Save**

### 5. Test It

1. Go back to the editor
2. Click **Run** → `syncAllAppointments`
3. Check the **Execution log** (View → Logs)
4. Look for:
   ```
   [VA] Found X email threads
   [VRE] Found X email threads
   [LifeStance] Found X email threads
   ✅ Created event: ...
   ```
5. Check your Google Calendar - should see RED appointments!

## How the Deduplication Works

Each appointment gets a unique "fingerprint":
- `VA:TRADER:2026-01-13T15:30:00.000Z`
- `VRE:LAKIA SMITH:2025-12-10T17:00:00.000Z`  
- `LIFESTANCE:LACEY LOWERS:2025-12-16T21:00:00.000Z`

This fingerprint is hidden in the event description as HTML comment.

**Result:** VA can send you 5 reminder emails, but you only get 1 calendar event.

## Troubleshooting

### "No appointments created"
- Check the logs for `⚠️` warnings
- Verify emails exist with `newer_than:30d`
- Make sure sender addresses match exactly

### "Duplicates still appearing"
- Old events created before this script won't have fingerprints
- **Solution:** Delete old duplicates manually, let script recreate them

### "Script timeout" 
- Happens if you have 100+ emails
- **Solution:** Reduce search window (change `newer_than:30d` to `newer_than:14d`)

### "Wrong timezone"
- Events appear shifted by hours
- **Solution:** In Apps Script, go to Project Settings → Set your timezone to `America/Chicago`

## Customization Options

### Change Color
In each `sync*Appointments()` function, change:
```javascript
event.setColor(CalendarApp.EventColor.RED);
```
Options: `RED`, `ORANGE`, `YELLOW`, `GREEN`, `BLUE`, `PURPLE`, `GRAY`

### Change Duration
For VA (currently 30 min):
```javascript
const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);
//                                               ↑ minutes
```

For LifeStance (currently 60 min):
```javascript
const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
```

### Scan More/Less History
Change `newer_than:30d` to `newer_than:14d` (2 weeks) or `newer_than:60d` (2 months)

## Support

If you hit issues:
1. Check **Execution log** (View → Logs in Apps Script)
2. Look for the `⚠️` warning messages
3. Send me the warning text for debugging

## Notes

- Script runs automatically every day at your chosen time
- First run will populate calendar with all appointments from last 30 days
- Subsequent runs only add new appointments
- Links update automatically when they arrive in new emails
- All appointments will be RED and clearly visible
