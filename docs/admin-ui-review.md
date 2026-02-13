# Admin UI Review — What’s Correct vs What to Fix

Review of all admin pages and client components against intended behavior. Issues are flagged and fixes applied where applicable.

---

## 1. Access & Index

| Item | Status | Notes |
|------|--------|--------|
| `/admin` redirect | ✅ Correct | Redirects to `/admin/reviews` after `requireAdmin()`. |
| `requireAdmin()` on every page | ✅ Correct | All admin pages call it and redirect to `/dashboard` on failure. |

---

## 2. Navigation Between Admin Pages

**Intended:** Every admin page should offer the same set of cross-links so admins can jump to Reviews, Flagged reviews, Custom categories, Users, Listings.

| Page | Has Reviews | Has Flagged | Has Custom Cat | Has Users | Has Listings |
|------|-------------|-------------|----------------|-----------|---------------|
| Reviews | — | ✅ | ✅ | ✅ | ✅ |
| Flagged reviews | ✅ | — | ❌ **Missing** | ✅ | ✅ |
| Custom categories | ✅ | ❌ **Missing** | — | ✅ | ✅ |
| Users | ❌ **Missing all** | ❌ | ❌ | — | ❌ |
| Listings | ❌ **Missing all** | ❌ | ❌ | ❌ | — |

**Issues:**
- **Users** and **Listings** have no nav links to other admin surfaces → admins must use browser back or dashboard.
- **Flagged reviews** is missing a link to **Custom categories**.
- **Custom categories** is missing a link to **Flagged reviews**.

**Fix:** Add the same nav block (Reviews, Flagged reviews, Custom categories, Users, Listings) to Users and Listings; add Custom categories link on Flagged page; add Flagged reviews link on Custom categories page.

---

## 3. Admin: Reviews (Review Moderation)

**Intended:** List all reviews (Market + Care), optionally include hidden; show context (type); hide abusive/off-topic; resolution window applies to negative public reviews.

| Item | Status | Notes |
|------|--------|--------|
| Page title / description | ✅ | “Admin: Review moderation” and hide abusive/off-topic + resolution window. |
| Show hidden toggle | ✅ | Link toggles `showHidden=1` and label “include/exclude hidden reviews”. |
| Table columns | ⚠️ **Partially wrong** | See below. |
| Hide button + loading | ✅ | HideReviewButton with “Hiding…” and error. |
| Empty state | ✅ | “No reviews (hidden reviews excluded)” etc. |

**Issues:**

1. **No Type (Market/Care) badge**  
   Data includes `type` (MARKET | CARE) but the table doesn’t show it. Admins can’t tell livestock/care vs product without opening context. **Fix:** Add the same Market/Care badge used on Flagged reviews (e.g. in the Review cell or a small Type column).

2. **Column “Reviewer / Producer”**  
   For **CARE** reviews, the reviewee is the caregiver/homestead owner, not “Producer”. Label is misleading for Care. **Fix:** Use “Reviewer / Reviewee” (or “Reviewer / Producer or caregiver”) so it’s correct for both Market and Care.

3. **Status “Flagged by producer”**  
   For CARE, the flagger is the caregiver/reviewee. **Fix:** Use “Flagged by reviewee” (or “Flagged by producer or caregiver”) so it’s correct for both.

4. **“Producer: {producerResponse}”**  
   For CARE, that’s the caregiver’s response. **Fix:** Use “Reviewee:” or “Response:” so wording is correct for both.

---

## 4. Admin: Flagged Reviews

**Intended:** Show Market and Care flagged reviews; approve (make public), dismiss flag, add guidance; protect reviewees (producers/caregivers) and give reviewers (buyers/care seekers) a path to be heard.

| Item | Status | Notes |
|------|--------|--------|
| Type badge (Market/Care) | ✅ | Green MARKET, blue CARE. |
| Actions: Approve, Dismiss, Guidance, Email/Copy buyer | ✅ | Match backend behavior. |
| Nav links | ⚠️ | Missing Custom categories (see §2). |

**Issues:**

1. **Labels “Buyer” and “Producer”**  
   For **CARE** reviews, the reviewer is a care seeker and the reviewee is a caregiver/homestead owner. Showing “Producer” for both Market and Care is misleading for Care. **Fix:** When `type === "CARE"` show “Caregiver” (or “Reviewee”) instead of “Producer”; keep “Buyer” as “Reviewer” or show “Reviewer” for both and “Producer/Caregiver” / “Reviewee” for the second party based on type.

2. **Empty state**  
   “Producers can flag reviews for admin review from their dashboard.” For Care, caregivers also flag. **Fix:** “Producers and caregivers can flag reviews from their dashboard.” or “Reviewees can flag reviews from their dashboard.”

3. **Guidance label**  
   “Add or edit guidance (visible to producer/buyer)”. For Care it’s caregiver/care seeker. **Fix:** “Visible to reviewee and reviewer” or “visible to producer/caregiver and buyer/care seeker”.

---

## 5. Admin: Custom Categories

**Intended:** Review pending custom categories from producers; Approve (with optional corrected name), Edit only (spelling, stays pending), Reject; audit log.

| Item | Status | Notes |
|------|--------|--------|
| Title, description, actions | ✅ | Match behavior (Approve, Correct & approve, Edit only, Reject). |
| Search, pagination, audit log | ✅ | Correct. |
| Nav | ⚠️ | Missing Flagged reviews (see §2). |

No other UI/copy mismatches; only nav fix needed.

---

## 6. Admin: Users & Listings

**Intended:** Placeholder pages until “protect + data” are implemented.

| Item | Status | Notes |
|------|--------|--------|
| Copy | ✅ | “User list and moderation (TODO: protect + data)” and “Moderate products and shops (TODO: protect + data)”. |
| Nav | ❌ | No links to other admin pages (see §2). |

---

## 7. Summary of Fixes Applied

1. **Nav:** Same admin nav block (Reviews, Flagged reviews, Custom categories, Users, Listings) on all five admin pages.
2. **Reviews table:** Add Type (Market/Care) badge; change “Reviewer / Producer” → “Reviewer / Reviewee”; “Flagged by producer” → “Flagged by reviewee”; “Producer:” response → “Reviewee:”.
3. **Flagged Reviews:** Add Custom categories link; type-aware label for second party (Producer vs Caregiver); empty state and guidance copy inclusive of caregivers.

---

## 8. Not Changed (By Design or Later)

- **Users/Listings:** Still placeholders; no data or actions until backend is ready.
- **Middleware:** No route-level protection for `/admin`; reliance on `requireAdmin()` per page/API (documented in admin-flow-review.md).
- **Doc:** admin-flow-review.md still says “Flagged reviews = MARKET only”; update to “Market and Care” to match current code.
