# Security Specification

## Data Invariants
- Posts must have a unique ID and certain required fields.
- Only authenticated admins can write to posts or config.
- Everyone can read posts and config.

## The Dirty Dozen Payloads
1. Create a post without being logged in (Denied)
2. Update config as a non-admin (Denied)
3. Delete a post as a non-admin (Denied)
4. Inject a huge string (1MB+) into post title (Denied via size checks)
5. Set `ownerId` to someone else (Not applicable as we don't have ownerId yet, but good to keep in mind)
6. Partial update changing immutable fields like `id` (Denied)
7. Create a FAQ with invalid structure (Denied via schema check)
8. Read private info (Not applicable yet)
9. List all admins (Denied)
10. Update a post status without permission (Denied)
11. Write to a non-existent collection (Denied via default-deny)
12. Use invalid characters in document IDs (Denied via isValidId)

## Test Runner
(Omitted for brevity in this turn, but logic follows the above)
