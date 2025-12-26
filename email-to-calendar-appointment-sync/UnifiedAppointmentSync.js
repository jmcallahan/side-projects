/**
 * Unified Appointment Sync for Google Calendar
 * Handles VA Video Connect, VR&E, and LifeStance appointments
 * All appointments colored RED with proper deduplication
 */

function syncAllAppointments() {
  Logger.log("=== Starting Unified Appointment Sync ===");
  
  syncVAAppointments();
  syncVREAppointments();
  syncLifeStanceAppointments();
  
  Logger.log("=== Sync Complete ===");
}

/**
 * VA Video Connect Appointments
 * Handles multiple reminder emails for same appointment
 * Updates event when video link becomes available
 */
function syncVAAppointments() {
  const calendar = CalendarApp.getDefaultCalendar();
  const threads = GmailApp.search('from:Video.Appointment@va.gov subject:"VA Video Connect" newer_than:30d');
  
  Logger.log(`[VA] Found ${threads.length} email threads`);
  
  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const body = message.getPlainBody();
      
      // Extract video link (only in day-of emails)
      const linkMatch = body.match(/https:\/\/veteran\.apps\.va\.gov\/go\/[a-zA-Z0-9]+/);
      const videoLink = linkMatch ? linkMatch[0] : null;
      
      // Extract provider name
      const providerMatch = body.match(/VA Clinician\s+([A-Z]+)/i);
      const provider = providerMatch ? providerMatch[1] : "VA Provider";
      
      // Match date format: "Tuesday, January 13, 2026, at 09:30 CST"
      const dateMatch = body.match(/([A-Za-z]+),\s+([A-Za-z]+ \d{1,2}, \d{4}),\s+at\s+(\d{1,2}:\d{2})\s*(AM|PM|CST|EST|PST|MST)?/i);
      
      if (!dateMatch) {
        Logger.log("[VA] ⚠️ No date match found in email");
        return;
      }
      
      // Parse the date string
      const rawDate = `${dateMatch[2]} ${dateMatch[3]} ${dateMatch[4] || ''}`.trim();
      const startTime = new Date(rawDate);
      
      // Validate date
      if (isNaN(startTime.getTime())) {
        Logger.log(`[VA] ⚠️ Invalid date parsed: ${rawDate}`);
        return;
      }
      
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 min duration
      
      // Create unique fingerprint: provider + date/time
      const fingerprint = `VA:${provider}:${startTime.toISOString()}`;
      
      const title = `VA Video - ${provider}`;
      const description = buildDescription(
        fingerprint,
        videoLink || "Link will be sent day-of appointment",
        "VA Video Connect Appointment"
      );
      
      // Check for existing event
      const existingEvent = findEventByFingerprint(calendar, fingerprint, startTime, endTime);
      
      if (existingEvent) {
        // Update if we now have a video link and didn't before
        const currentDesc = existingEvent.getDescription();
        if (videoLink && currentDesc.includes("Link will be sent day-of")) {
          existingEvent.setDescription(buildDescription(fingerprint, videoLink, "VA Video Connect Appointment"));
          Logger.log(`[VA] ✏️ Updated event with video link for ${provider}`);
        } else {
          Logger.log(`[VA] ✓ Event exists: ${provider} at ${startTime}`);
        }
      } else {
        // Create new event
        const event = calendar.createEvent(title, startTime, endTime, { description });
        event.setColor(CalendarApp.EventColor.RED);
        Logger.log(`[VA] ✅ Created event: ${provider} at ${startTime}`);
      }
    });
  });
}

/**
 * VR&E (Vocational Rehab & Employment) Appointments
 */
function syncVREAppointments() {
  const calendar = CalendarApp.getDefaultCalendar();
  const threads = GmailApp.search('from:eva@va.gov subject:"appointment with" newer_than:30d');
  
  Logger.log(`[VRE] Found ${threads.length} email threads`);
  
  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const body = message.getPlainBody();
      
      // Extract provider from subject
      const subject = message.getSubject();
      const providerMatch = subject.match(/appointment with\s+([A-Z\s]+)/i);
      const provider = providerMatch ? providerMatch[1].trim() : "VRE Counselor";
      
      // Extract date: "12/10/2025 from 11:00 AM to 11:30 AM CST"
      const dateMatch = body.match(/(\d{1,2}\/\d{1,2}\/\d{4})\s+from\s+(\d{1,2}:\d{2}\s+(?:AM|PM))\s+to\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/i);
      
      if (!dateMatch) {
        Logger.log("[VRE] ⚠️ No date match found");
        return;
      }
      
      const startTime = new Date(`${dateMatch[1]} ${dateMatch[2]}`);
      const endTime = new Date(`${dateMatch[1]} ${dateMatch[3]}`);
      
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        Logger.log(`[VRE] ⚠️ Invalid date parsed`);
        return;
      }
      
      // Extract VRE video link
      const linkMatch = body.match(/https:\/\/vc\.va\.gov\/vre-app\/\?[^\s<]+/);
      const videoLink = linkMatch ? linkMatch[0] : null;
      
      const fingerprint = `VRE:${provider}:${startTime.toISOString()}`;
      
      const title = `VR&E - ${provider}`;
      const description = buildDescription(
        fingerprint,
        videoLink || "No link provided",
        "VR&E Counseling Session"
      );
      
      const existingEvent = findEventByFingerprint(calendar, fingerprint, startTime, endTime);
      
      if (!existingEvent) {
        const event = calendar.createEvent(title, startTime, endTime, { description });
        event.setColor(CalendarApp.EventColor.RED);
        Logger.log(`[VRE] ✅ Created event: ${provider} at ${startTime}`);
      } else {
        Logger.log(`[VRE] ✓ Event exists: ${provider} at ${startTime}`);
      }
    });
  });
}

/**
 * LifeStance Health Appointments
 * Handles both scheduling emails and day-of check-in emails
 */
function syncLifeStanceAppointments() {
  const calendar = CalendarApp.getDefaultCalendar();
  const threads = GmailApp.search('from:registration@phreesia-mail.com newer_than:30d');
  
  Logger.log(`[LifeStance] Found ${threads.length} email threads`);
  
  threads.forEach(thread => {
    thread.getMessages().forEach(message => {
      const htmlBody = message.getBody();
      const plainBody = htmlBody.replace(/<[^>]+>/g, ' '); // Strip HTML
      
      // Extract provider name
      const providerMatch = plainBody.match(/appointment with\s+([A-Z\s]+)\s+(?:at|on)/i);
      const provider = providerMatch ? providerMatch[1].trim() : "LifeStance Provider";
      
      // Date format: "Tuesday, December 16, 2025 3:00 PM"
      const dateMatch = plainBody.match(/(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+([A-Za-z]+\s+\d{1,2},\s+\d{4})\s+(\d{1,2}:\d{2}\s+(?:AM|PM))/i);
      
      if (!dateMatch) {
        Logger.log("[LifeStance] ⚠️ No date match found");
        return;
      }
      
      const dateStr = `${dateMatch[2]} ${dateMatch[3]}`;
      const startTime = new Date(dateStr);
      
      if (isNaN(startTime.getTime())) {
        Logger.log(`[LifeStance] ⚠️ Invalid date: ${dateStr}`);
        return;
      }
      
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
      
      // Look for check-in link (appears in day-of emails)
      const checkinMatch = htmlBody.match(/https:\/\/[^"'\s]+phreesia[^"'\s]+/);
      const checkinLink = checkinMatch ? checkinMatch[0] : null;
      
      const fingerprint = `LIFESTANCE:${provider}:${startTime.toISOString()}`;
      
      const title = `LifeStance - ${provider}`;
      const linkText = checkinLink 
        ? `Check-in link: ${checkinLink}`
        : "Zoom link will be sent 30 minutes before appointment";
      
      const description = buildDescription(fingerprint, linkText, "Telehealth Therapy Session");
      
      const existingEvent = findEventByFingerprint(calendar, fingerprint, startTime, endTime);
      
      if (existingEvent) {
        // Update if check-in link becomes available
        const currentDesc = existingEvent.getDescription();
        if (checkinLink && currentDesc.includes("will be sent 30 minutes")) {
          existingEvent.setDescription(buildDescription(fingerprint, `Check-in link: ${checkinLink}`, "Telehealth Therapy Session"));
          Logger.log(`[LifeStance] ✏️ Updated event with check-in link for ${provider}`);
        } else {
          Logger.log(`[LifeStance] ✓ Event exists: ${provider} at ${startTime}`);
        }
      } else {
        const event = calendar.createEvent(title, startTime, endTime, { description });
        event.setColor(CalendarApp.EventColor.RED);
        Logger.log(`[LifeStance] ✅ Created event: ${provider} at ${startTime}`);
      }
    });
  });
}

/**
 * Helper: Build standardized event description
 */
function buildDescription(fingerprint, link, appointmentType) {
  return `${appointmentType}

${link}

[Auto-synced from email]
<!-- FINGERPRINT:${fingerprint} -->`;
}

/**
 * Helper: Find existing event by fingerprint
 * Prevents duplicates even if provider name varies slightly
 */
function findEventByFingerprint(calendar, fingerprint, startTime, endTime) {
  const events = calendar.getEvents(startTime, endTime);
  
  for (let event of events) {
    const desc = event.getDescription();
    if (desc && desc.includes(`FINGERPRINT:${fingerprint}`)) {
      return event;
    }
  }
  
  return null;
}
