/**
 * Auto-Clean Unsubscribe Emails
 * 
 * Automatically trashes emails labeled "Unsubscribe"
 * Runs silently with proper error handling
 */

function autoCleanUnsubscribes() {
  const LABEL = 'Unsubscribe';
  const MAX_THREADS = 100; // Process up to 100 at once
  
  try {
    // Ensure label exists
    let label = GmailApp.getUserLabelByName(LABEL);
    
    // If label doesn't exist, create it silently
    if (!label) {
      label = GmailApp.createLabel(LABEL);
      Logger.log(`✅ Created label "${LABEL}"`);
    }
    
    // Search for labeled threads
    const threads = GmailApp.search(`label:${LABEL}`, 0, MAX_THREADS);
    
    // If no threads found, exit silently
    if (threads.length === 0) {
      Logger.log(`✓ No emails to clean with label "${LABEL}"`);
      return;
    }
    
    Logger.log(`🧹 Cleaning ${threads.length} threads with label "${LABEL}"`);
    
    let trashedCount = 0;
    
    // Process each thread
    threads.forEach(thread => {
      try {
        // Move entire thread to trash (more efficient than per-message)
        thread.moveToTrash();
        trashedCount++;
      } catch (e) {
        Logger.log(`⚠️ Could not trash thread: ${e.message}`);
      }
    });
    
    Logger.log(`✅ Successfully trashed ${trashedCount} email threads`);
    
  } catch (error) {
    // Log error but don't throw (prevents error emails)
    Logger.log(`⚠️ Error in autoCleanUnsubscribes: ${error.message}`);
  }
}

/**
 * Optional: Also auto-trash specific senders
 * Add this if you want to automatically trash certain newsletters
 */
function autoTrashSpecificSenders() {
  const SENDERS_TO_TRASH = [
    // Add email addresses or domains you want to auto-trash
    // 'newsletter@example.com',
    // 'marketing@company.com'
  ];
  
  // Skip if no senders configured
  if (SENDERS_TO_TRASH.length === 0) {
    return;
  }
  
  try {
    SENDERS_TO_TRASH.forEach(sender => {
      const threads = GmailApp.search(`from:${sender} newer_than:7d`, 0, 50);
      
      if (threads.length > 0) {
        Logger.log(`🗑️ Trashing ${threads.length} emails from ${sender}`);
        threads.forEach(thread => thread.moveToTrash());
      }
    });
  } catch (error) {
    Logger.log(`⚠️ Error in autoTrashSpecificSenders: ${error.message}`);
  }
}
