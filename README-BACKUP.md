# Aquarius Institute MCQ Platform - Backup System

This document explains the backup and restore system for the Aquarius Institute MCQ Platform.

## Overview

The platform includes an automatic daily backup system that safeguards your valuable data, including:
- User accounts
- Topics
- Questions (including images)
- Session data and student performance records

## Automatic Daily Backups

Backups are automatically scheduled to run daily at 8:00 AM. Each backup creates a timestamped JSON file in the `backups` directory.

The system automatically keeps the 7 most recent backups to save disk space.

## Manual Backups

To create a backup manually at any time:

```bash
node scripts/manual-backup.js
```

This will create a backup file with the current timestamp in the `backups` directory.

## Restoring from a Backup

If you need to restore the platform from a backup:

1. View available backups:
```bash
node scripts/restore.js
```

2. Restore from a specific backup:
```bash
node scripts/restore.js backup-YYYY-MM-DDTHH-mm-ss.json
```

Replace `backup-YYYY-MM-DDTHH-mm-ss.json` with the actual backup file name you want to restore.

> **Important Note:** When restoring from a backup, user passwords will be reset to a temporary password. Users will need to use the password reset functionality to set a new password.

## Backup File Location

Backup files are stored in the `backups` directory in the project root. Each backup is a JSON file with a timestamp in the format `backup-YYYY-MM-DDTHH-mm-ss.json`.

## Logs

Logs for the backup scheduler are stored in the `logs` directory in the file `backup-scheduler.log`. These logs can be useful for troubleshooting if backups are not running as expected.

## Security Considerations

- Backup files contain sensitive information and should be protected accordingly.
- User passwords are not included in backups for security reasons.
- Consider implementing additional measures to secure backup files if needed, such as encryption or offsite storage.

---

For any questions or issues with the backup system, please contact the system administrator.
