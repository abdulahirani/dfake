# Security Specification

## Data Invariants
- Posts must have a valid slug ID matching `^[a-zA-Z0-9_-]+$` (max 128 chars), title (1-200 chars), and content (1-50000 chars).
- Only the verified admin (`gundkatira007@gmail.com` with `email_verified == true`) can create, update, or delete posts or global config.
- Public readers and search engine crawlers can read published posts (`posts/{postId}`) and public site config (`config/main`).
- Timestamps (`createdAt`, `updatedAt`) are validated against `request.time`, and `createdAt` + `id` are immutable on update.

## The Dirty Dozen Payloads
1. Create a post without being logged in -> PERMISSION_DENIED
2. Create a post logged in as non-admin user -> PERMISSION_DENIED
3. Spoof admin email with `email_verified: false` -> PERMISSION_DENIED
4. Update config as a non-admin -> PERMISSION_DENIED
5. Delete a post as a non-admin -> PERMISSION_DENIED
6. Inject a huge string (1MB+) into post title or content -> PERMISSION_DENIED (size check)
7. Inject a ghost/shadow field (e.g. `isAdmin: true`) into `/posts/{postId}` -> PERMISSION_DENIED (`hasOnly`)
8. Partial update mutating immutable `id` or `createdAt` -> PERMISSION_DENIED
9. Forge a client-side `createdAt` or `updatedAt` timestamp -> PERMISSION_DENIED (`request.time` check)
10. Write to a non-existent collection `/admins/fake` -> PERMISSION_DENIED (default-deny)
11. Use invalid path-traversal or oversized characters in `postId` -> PERMISSION_DENIED (`isValidId`)
12. List `/config` collection or write to `/config/other` -> PERMISSION_DENIED
