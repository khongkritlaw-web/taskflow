# Security Specifications (TDD Spec)

## 1. Data Invariants
- **Identity Lock**: A user can only read, create, update, or delete records within their own user space (`/users/{uid}/**`). Specifically, `{uid}` must match the `request.auth.uid`.
- **Credential Protection**: Account credentials (`/users/{uid}`) must be restricted so that readers can only search or read their own credentials.
- **Task Integrity**: A `Task` document must contain valid required fields. `status` is restricted to "pending" or "completed". `id` and `userId` are immutable after creation.
- **Expense Integrity**: An `Expense` document must contain valid required fields (name, amount, date, dueDate, cat). `id` and `userId` are immutable after creation. Amount must be a positive number.
- **Settings Integrity**: User app settings (`/users/{uid}/settings/app`) can only be modified by the authorized user with valid custom settings data keys.

## 2. The "Dirty Dozen" (Vulnerability Payloads)

1. **Anonymous Write to Settings**: Create other user's app settings without authenticating.
2. **Settings Spoof**: Attempt to write settings under another user’s UID.
3. **Task Owner Spoof**: Creating a task named high-priority but setting the `userId` in the payload field maliciously to different UIDs.
4. **Task Injection**: Injecting a 1MB junk-character string into the task ID field or title.
5. **Direct Status Shortcutting**: Forcing completed status on other users' tasks.
6. **Task Modification (Immutability Violation)**: Attempting to update `createdAt` or `id` fields of existing tasks.
7. **Expense Overwrite**: Writing random text keys in expense categories.
8. **Negative Expenses**: Sending negative amounts in the expense records.
9. **Blanket Collection Scraping**: Querying the full `/users` collection list without specifying the exact user document.
10. **Admin Spoofing**: Attempting to declare oneself as an administrator in the database or user fields.
11. **ID Poisoning**: Creating tasks with malicious path variable IDs (e.g., junk characters or path traversal separators).
12. **PII Disclosure**: Reading emails or phone numbers of other registered users.

---

## 3. Fortress Rules Blueprint (Target Rules)
The security rules will enforce:
- Exact path pattern matching `/users/{userId}` where `userId == request.auth.uid`.
- Validation helpers for Task (`isValidTask`), Expense (`isValidExpense`), and Settings (`isValidSettings`).
- Immutable key audits for update actions.
