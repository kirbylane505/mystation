# Premium Comment System Design

## Summary
Subscriber-only commenting with threaded admin replies. Non-subscribers see comments read-only. Admin (Mike Page) replies inline with verified badge + IDMG label. Admin auth via existing ADMIN_KEY.

## Database
Add columns to existing `comments` table:
- `parent_id uuid REFERENCES comments(id) DEFAULT NULL`
- `is_admin boolean DEFAULT false`
- `role text DEFAULT 'fan'`

## API Changes

### GET /api/comments
- Nest replies under parent comments: `{ comments: [{ ...comment, replies: [...] }] }`

### POST /api/comments
- New fields: `parentId` (optional), `adminKey` (optional)
- Non-admin posts: require `mystation-sub` cookie, return 403 if missing
- Admin posts: validate `adminKey` against env `ADMIN_KEY`, set `is_admin: true`, `role: 'admin'`, `username: 'Mike Page'`

### DELETE /api/comments
- New endpoint. Admin-only (requires `adminKey` in body). Deletes comment by ID.

## Component: CommentSection.jsx
1. Sub gate — non-subscribers see "Subscribe to join the conversation" CTA instead of input
2. Admin mode toggle — lock icon in footer, key input, stores in sessionStorage
3. Reply UI — inline reply input under each comment (admin only), posts with parentId + adminKey
4. Reply display — indented with arrow, "Mike Page" name, blue checkmark, gold "IDMG" badge
5. Delete — trash icon per comment (admin only), confirm before delete

## Visual
- Admin replies: indented, verified badge, gold IDMG label
- Non-sub footer: lock icon + subscribe CTA
- Admin footer: green "Admin Mode ON" indicator
- Everything else unchanged: glass theme, optimistic posts, rate limits, email notifications
