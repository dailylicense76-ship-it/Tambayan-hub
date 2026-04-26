# Firebase Security Spec - Tambayan Marketplace

## Data Invariants
- Users can only edit their own profile.
- Posts must have a valid `userId` matching the creator.
- Orders must link a buyer and a seller. Only the seller or buyer can read the order.
- Only the seller can update the order status.
- Admin fields (`isAdmin`) cannot be set by users themselves.
- `admins` collection contains the true list of admins.

## The "Dirty Dozen" Payloads (Deny Expected)

1. **Identity Spoofing**: User A trying to create a post with `userId: "UserB"`.
2. **Privilege Escalation**: User A trying to set `isAdmin: true` on their own profile.
3. **Shadow Update**: User A trying to add a `verified: true` field to their post.
4. **Orphaned Write**: Creating a post with a non-existent `userId`.
5. **State Shortcut**: Buyer trying to mark an order as `delivered` before it's `shipped`.
6. **Resource Poisoning**: Large string (1MB) injected into `postId`.
7. **Cross-User Read**: User A trying to list User B's private orders.
8. **PII Leak**: Guest trying to list all users' emails.
9. **Admin Spoofing**: User A trying to write to the `admins` collection.
10. **Time Travel**: User A trying to set `createdAt` to a future date instead of `request.time`.
11. **Immutability Breach**: User A trying to change the `sellerId` of an existing order.
12. **Blanket Query**: Authenticated user trying to fetch all orders without a specific filter.

## Test Runner (Logic)
The following rules will be tested against these cases.
- `allow create/update` will use `isValid[Entity]()` helpers.
- `allow update` will use `affectedKeys().hasOnly()` gates.
- `allow read` for orders will enforce `resource.data.buyerId == request.auth.uid || resource.data.sellerId == request.auth.uid`.
