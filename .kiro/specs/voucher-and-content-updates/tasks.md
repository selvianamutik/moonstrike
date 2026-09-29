# Implementation Plan: Voucher and Content Updates

## Overview

This implementation plan breaks down the voucher discount system, admin voucher management, footer contact updates, and benefits carousel enhancements into discrete coding steps. The feature adds promotional discount functionality to the checkout flow, provides admin tools for voucher CRUD operations, updates the footer with Discord contact information, and transforms the "Why Choose Us" section into a multi-image carousel.

Implementation follows a layered approach: database schema first, then service layer, API layer, and finally UI components. Testing tasks are included as optional sub-tasks to validate correctness properties defined in the design.

## Tasks

- [ ] 1. Set up database schema and types for vouchers
  - [x] 1.1 Create database migration for vouchers table
    - Create migration file: `supabase/migrations/[timestamp]_create_vouchers_table.sql`
    - Define vouchers table with columns: id, code, discount_percentage, expires_at, created_by, created_at, updated_at
    - Add UNIQUE constraint on UPPER(code) for case-insensitive uniqueness
    - Add CHECK constraint for discount_percentage range (0-100)
    - Create indexes on UPPER(code) and expires_at
    - Enable RLS with service_role policy
    - Add trigger for updated_at column
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_
  
  - [x] 1.2 Create TypeScript types for voucher data
    - Create file: `lib/vouchers/types.ts`
    - Define interfaces: Voucher, VoucherWithStatus, CreateVoucherInput, UpdateVoucherInput, ValidateVoucherResponse, AppliedVoucher
    - Export all types for use across application
    - _Requirements: 1.1, 2.1, 3.1_
  
  - [ ] 1.3 Run database migration and verify schema
    - Execute migration against Supabase database
    - Verify table created with correct schema
    - Verify constraints and indexes applied
    - Test UNIQUE constraint with case-insensitive codes
    - _Requirements: 9.1_

- [ ] 2. Implement voucher service layer (business logic)
  - [ ] 2.1 Create discount calculator utility
    - Create file: `lib/vouchers/calculator.ts`
    - Implement calculateDiscount function (subtotal × percentage ÷ 100, rounded to 2 decimals)
    - Implement calculateTotal function (subtotal - discount)
    - Implement computePriceBreakdown function (returns full price breakdown object)
    - Handle both USD and EUR currencies
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 2.2 Write property test for discount calculation
    - **Property 2: Discount calculation accuracy**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
    - Use fast-check library with 100 iterations
    - Test discount calculation with random subtotals (0-100000), percentages (0-100), and currencies (USD/EUR)
    - Verify result equals (subtotal × percentage ÷ 100) rounded to 2 decimals
    - Test file: `lib/vouchers/__tests__/calculator.test.ts`
  
  - [ ] 2.3 Create voucher validation service
    - Create file: `lib/vouchers/service.ts`
    - Implement validateVoucherCode function (query database, check expiration)
    - Implement case-insensitive code matching using UPPER()
    - Return voucher object if valid, null if invalid or expired
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 2.4 Write property test for voucher validation logic
    - **Property 1: Voucher validation logic**
    - **Validates: Requirements 1.2, 3.1, 3.2, 3.5**
    - Use fast-check with 100 iterations
    - Test validation with mock database (code exists/not exists, expired/valid dates)
    - Verify correct return values for all scenarios
    - Test file: `lib/vouchers/__tests__/service.test.ts`
  
  - [x] 2.5 Implement admin voucher CRUD operations in service layer
    - Add to `lib/vouchers/service.ts`
    - Implement listVouchers function (query all vouchers, compute status)
    - Implement createVoucher function (validate inputs, check uniqueness, insert to DB)
    - Implement updateVoucher function (validate inputs, update discount and expiration only)
    - Implement deleteVoucher function (hard delete from DB)
    - Implement computeVoucherStatus helper (compare expiration to current time)
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 2.6 Write unit tests for admin voucher CRUD operations
    - Test voucher creation with valid data
    - Test uniqueness constraint rejection
    - Test discount range validation (0-100)
    - Test required field validation
    - Test update operations (code immutability)
    - Test delete operations
    - Test status computation with various expiration dates
    - Test file: `lib/vouchers/__tests__/service.test.ts`

- [ ] 3. Create voucher validation API endpoint
  - [ ] 3.1 Implement voucher validation API route
    - Create file: `app/api/vouchers/validate/route.ts`
    - Define POST endpoint accepting { code: string }
    - Validate request body with Zod schema
    - Call validateVoucherCode service function
    - Return { code, discountPercentage } on success (200)
    - Return specific error messages on failure (400): "Voucher code not found", "Voucher has expired", "Invalid voucher code"
    - Add rate limiting to prevent brute force attacks
    - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 3.2 Write integration test for validation API
    - Test validation with existing valid voucher
    - Test validation with non-existent code
    - Test validation with expired voucher
    - Test error message specificity
    - Test case-insensitive code matching
    - Test file: `app/api/vouchers/validate/__tests__/route.test.ts`

- [ ] 4. Create admin voucher management API endpoints
  - [x] 4.1 Implement GET /api/admin/vouchers endpoint
    - Create file: `app/api/admin/vouchers/route.ts`
    - Add admin authentication check
    - Call listVouchers service function
    - Return vouchers sorted by created_at DESC
    - Return status computed from expiration date
    - _Requirements: 5.1, 5.2_
  
  - [x] 4.2 Implement POST /api/admin/vouchers endpoint
    - Add to `app/api/admin/vouchers/route.ts`
    - Add admin authentication check
    - Validate request body with Zod schema (code, discountPercentage, expiresAt)
    - Call createVoucher service function
    - Return created voucher (201) or validation errors (400)
    - Handle duplicate code error specifically
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 4.3 Implement PATCH /api/admin/vouchers/[id] endpoint
    - Create file: `app/api/admin/vouchers/[id]/route.ts`
    - Add admin authentication check
    - Validate request body (discountPercentage, expiresAt only - code immutable)
    - Call updateVoucher service function
    - Return updated voucher (200) or validation errors (400)
    - _Requirements: 5.3, 5.4_
  
  - [x] 4.4 Implement DELETE /api/admin/vouchers/[id] endpoint
    - Add to `app/api/admin/vouchers/[id]/route.ts`
    - Add admin authentication check
    - Call deleteVoucher service function
    - Return success confirmation (200)
    - _Requirements: 5.5_
  
  - [ ]* 4.5 Write integration tests for admin voucher APIs
    - Test GET endpoint returns all vouchers with correct status
    - Test POST endpoint creates voucher with valid data
    - Test POST endpoint rejects duplicate codes
    - Test POST endpoint validates discount range (0-100)
    - Test PATCH endpoint updates discount and expiration
    - Test PATCH endpoint prevents code modification
    - Test DELETE endpoint removes voucher from database
    - Test authentication requirements for all endpoints
    - Test file: `app/api/admin/vouchers/__tests__/route.test.ts`

- [ ] 5. Checkpoint - Verify backend voucher system works
  - Ensure all tests pass
  - Manually test API endpoints with Postman or similar tool
  - Verify database constraints enforce data integrity
  - Ask the user if questions arise

- [ ] 6. Create frontend voucher input component
  - [ ] 6.1 Implement VoucherInput component
    - Create file: `components/cart/voucher-input.tsx`
    - Add text input field with uppercase transformation
    - Add "Apply" button to trigger validation
    - Implement loading state (disabled input with spinner)
    - Implement success state (green checkmark, discount percentage display, "Remove" link)
    - Implement error state (red error message below input)
    - Call /api/vouchers/validate endpoint on apply
    - Emit onVoucherApplied callback with voucher data on success
    - Emit onVoucherRemoved callback when user clicks "Remove"
    - Display specific error messages from API
    - _Requirements: 1.1, 1.2, 1.5_
  
  - [ ]* 6.2 Write unit tests for VoucherInput component
    - Test rendering of input field and apply button
    - Test uppercase transformation of input
    - Test loading state during validation
    - Test success state with discount display
    - Test error state with error message
    - Test remove functionality
    - Mock API calls
    - Test file: `components/cart/__tests__/voucher-input.test.tsx`

- [ ] 7. Enhance OrderSummary component with voucher display
  - [ ] 7.1 Update OrderSummary component to display voucher discount
    - Modify file: `components/order-summary.tsx`
    - Add optional voucher prop: { code, discountAmount, discountPercentage }
    - Add voucher discount row between subtotal and total
    - Format discount row: "Discount (CODE: XX%)" with negative amount in green
    - Display total with discounted price in bold
    - Handle both USD and EUR currencies
    - _Requirements: 1.3, 1.4, 2.5_
  
  - [ ]* 7.2 Write property test for order summary display completeness
    - **Property 3: Order summary display completeness**
    - **Validates: Requirements 1.3, 1.4, 2.5**
    - Use fast-check with 100 iterations
    - Test with random subtotals and discount percentages
    - Verify all three components displayed (subtotal, discount, total)
    - Verify discount shown as negative or reduction
    - Verify total less than subtotal when voucher applied
    - Test file: `components/__tests__/order-summary.test.tsx`

- [ ] 8. Integrate voucher functionality into cart page
  - [ ] 8.1 Add VoucherInput to cart page and implement state management
    - Modify file: `app/(customer)/cart/page.tsx` or cart client component
    - Add VoucherInput component to cart page UI
    - Add voucher state to cart state management
    - Implement session storage persistence for applied voucher
    - Recalculate cart totals when voucher applied
    - Pass voucher data to OrderSummary component
    - Clear voucher on user removal
    - Revalidate voucher on page load from session storage
    - _Requirements: 1.1, 1.6_
  
  - [ ]* 8.2 Write integration test for voucher session persistence
    - **Property 4: Voucher session persistence**
    - **Validates: Requirements 1.6**
    - Test voucher persists across page refresh
    - Test voucher persists during navigation
    - Test voucher cleared on user removal
    - Test voucher revalidated on page load
    - Test file: `app/(customer)/cart/__tests__/page.test.tsx`

- [ ] 9. Integrate voucher into checkout flow
  - [ ] 9.1 Pass voucher data to checkout page and Stripe session
    - Modify checkout page and Stripe checkout creation logic
    - Transfer voucher from cart state to checkout state
    - Pass voucher data to OrderSummary in checkout page
    - Include voucher code and discount percentage in Stripe checkout session metadata
    - Apply discount to line_items total amount
    - Add voucher description to Stripe product_data
    - _Requirements: 1.7, 2.1_
  
  - [ ]* 9.2 Write integration test for cross-page voucher transfer
    - **Property 5: Cross-page voucher transfer**
    - **Validates: Requirements 1.7**
    - Test voucher data transfers from cart to checkout
    - Test same discount displayed on both pages
    - Test voucher included in Stripe metadata
    - Test discounted total matches calculation
    - Test file: `app/(customer)/checkout/__tests__/page.test.tsx`

- [ ] 10. Checkpoint - Verify frontend voucher system works
  - Ensure all tests pass
  - Manually test voucher application flow end-to-end
  - Test with valid, invalid, and expired voucher codes
  - Verify discount calculations are correct
  - Verify session persistence works
  - Ask the user if questions arise

- [ ] 11. Update footer with Discord contact
  - [ ] 11.1 Add Discord contact link to site footer
    - Modify file: `components/site-footer.tsx`
    - Add Discord icon import (FontAwesome faDiscord)
    - Add Discord contact entry in Contact Us section
    - Display static text "moonstrike.pro" with Discord icon
    - Match styling of existing contact links (phone/email)
    - Apply hover effect consistent with other links
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 11.2 Write unit test for footer Discord link
    - Test Discord link renders in footer
    - Test Discord icon displays
    - Test text content is "moonstrike.pro"
    - Test styling matches other social links
    - Test file: `components/__tests__/site-footer.test.tsx`

- [ ] 12. Enhance landing content types for multi-image carousel
  - [ ] 12.1 Update landing content types to support image arrays
    - Modify file: `lib/cms/landing.ts`
    - Add BenefitsImage interface (imageUrl, thumbnailUrl, storagePath, thumbnailPath, displayOrder)
    - Update LandingBenefitsData interface to include images array
    - Keep legacy single image fields for backward compatibility
    - _Requirements: 7.1, 10.2, 10.3_
  
  - [ ] 12.2 Create data migration script for benefits images
    - Create file: `scripts/migrate-benefits-images.ts`
    - Add empty images array to existing benefits_section records
    - Preserve existing single image data in legacy fields
    - Run migration against database
    - _Requirements: 10.5_

- [ ] 13. Create benefits carousel component
  - [ ] 13.1 Implement BenefitsCarousel component
    - Create file: `components/benefits-carousel.tsx`
    - Accept images array and alt text as props
    - Implement carousel wrapper with relative positioning
    - Display current image with fade transitions
    - Add left/right navigation arrows (visible only if > 1 image)
    - Add dot indicators at bottom (visible only if > 1 image)
    - Implement auto-advance timer (6 seconds)
    - Pause auto-advance on hover
    - Reset timer on manual navigation
    - Handle edge cases: 0 images (placeholder), 1 image (no controls)
    - Use Next.js Image component with priority on first image
    - Reuse styling patterns from HeroCarousel
    - _Requirements: 7.2, 7.3, 7.4, 7.5, 7.6, 8.5, 8.6_
  
  - [ ]* 13.2 Write property test for carousel auto-advance behavior
    - **Property 11: Carousel auto-advance behavior**
    - **Validates: Requirements 7.4, 7.5, 7.6**
    - Test auto-advance after 6 seconds
    - Test pause on hover
    - Test resume after hover ends
    - Test timer reset on manual navigation
    - Mock timers in tests
    - Test file: `components/__tests__/benefits-carousel.test.tsx`
  
  - [ ]* 13.3 Write unit tests for carousel navigation visibility
    - **Property 14: Carousel navigation visibility**
    - **Validates: Requirements 7.3, 8.6**
    - Test navigation arrows hidden with 0-1 images
    - Test navigation arrows visible with 2+ images
    - Test dot indicators hidden with 0-1 images
    - Test dot indicators visible with 2+ images
    - Test manual navigation (prev/next buttons)
    - Test dot indicator clicks
    - Test file: `components/__tests__/benefits-carousel.test.tsx`

- [ ] 14. Integrate BenefitsCarousel into landing page
  - [ ] 14.1 Update benefits section to use carousel component
    - Modify benefits section component on landing page
    - Fetch benefits data with images array from CMS
    - Pass images array to BenefitsCarousel component
    - Implement fallback: if images array exists and has items, use carousel; else use single image (legacy)
    - Display placeholder if no images exist
    - _Requirements: 7.2, 8.5_
  
  - [ ]* 14.2 Write integration test for benefits section rendering
    - Test carousel renders with multiple images
    - Test single image renders without carousel controls
    - Test placeholder shows when no images
    - Test backward compatibility with legacy single-image data
    - Test file: `app/(marketing)/__tests__/page.test.tsx`

- [ ] 15. Implement admin voucher manager UI
  - [x] 15.1 Create AdminVoucherManager component
    - Create file: `app/admin/content/voucher-manager.tsx`
    - Fetch vouchers from GET /api/admin/vouchers
    - Display vouchers in table format (columns: Code, Discount %, Expires At, Status, Actions)
    - Display status badge: Green "Active" or Gray "Expired"
    - Add "Create Voucher" button to open modal
    - Add Edit and Delete action buttons per row
    - _Requirements: 4.1, 5.1, 5.2, 5.6_
  
  - [x] 15.2 Create voucher create/edit modal with form
    - Add modal component to AdminVoucherManager
    - Form fields: Code (text, required), Discount % (number 0-100, required), Expiration Date (datetime picker, required)
    - Client-side validation: required fields, discount range, future expiration date
    - Disable code field in edit mode (immutable)
    - Call POST /api/admin/vouchers for create
    - Call PATCH /api/admin/vouchers/[id] for edit
    - Display validation errors inline on form fields
    - Show success toast on save
    - Show error toast on failure
    - Close modal and refresh list on success
    - _Requirements: 4.2, 4.3, 4.4, 5.3, 5.4_
  
  - [x] 15.3 Implement voucher deletion with confirmation dialog
    - Add confirmation dialog for delete action
    - Display warning: "Are you sure you want to delete voucher CODE?"
    - Call DELETE /api/admin/vouchers/[id] on confirm
    - Show success toast on deletion
    - Show error toast on failure
    - Refresh voucher list on success
    - _Requirements: 5.5_
  
  - [ ]* 15.4 Write property test for admin voucher creation validation
    - **Property 6: Admin voucher creation validation**
    - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**
    - Use fast-check with 100 iterations
    - Test with random codes, discount values, and expiration dates
    - Verify uniqueness constraint enforced
    - Verify discount range validation (0-100)
    - Verify required fields validation
    - Test file: `app/admin/content/__tests__/voucher-manager.test.tsx`
  
  - [ ]* 15.5 Write property test for voucher code immutability
    - **Property 7: Admin voucher code immutability**
    - **Validates: Requirements 5.3, 5.4**
    - Test code field disabled in edit mode
    - Test only discount and expiration can be updated
    - Test code remains unchanged after update
    - Test file: `app/admin/content/__tests__/voucher-manager.test.tsx`
  
  - [ ]* 15.6 Write property test for voucher deletion completeness
    - **Property 8: Admin voucher deletion completeness**
    - **Validates: Requirements 5.5**
    - Test voucher removed from database after deletion
    - Test subsequent queries return no results for deleted code
    - Test file: `app/admin/content/__tests__/voucher-manager.test.tsx`
  
  - [ ]* 15.7 Write property test for status computation
    - **Property 9: Voucher status computation**
    - **Validates: Requirements 5.6**
    - Use fast-check with 100 iterations
    - Test with random expiration dates
    - Verify status is "active" if date in future
    - Verify status is "expired" if date in past
    - Test file: `app/admin/content/__tests__/voucher-manager.test.tsx`

- [ ] 16. Add AdminVoucherManager to admin content section
  - [x] 16.1 Integrate voucher manager into admin content navigation
    - Modify admin content section layout/navigation
    - Add "Voucher Management" tab/link alongside existing content types
    - Render AdminVoucherManager component when selected
    - Ensure admin authentication required
    - _Requirements: 4.1_
  
  - [ ]* 16.2 Write integration test for admin content section
    - Test voucher management tab appears in navigation
    - Test voucher manager renders when selected
    - Test authentication required to access
    - Test file: `app/admin/content/__tests__/page.test.tsx`

- [ ] 17. Implement admin UI for benefits carousel image management
  - [ ] 17.1 Add multi-image upload to benefits section editor
    - Modify admin benefits section editor component
    - Add multiple image upload input (accept multiple files)
    - Implement thumbnail generation using Sharp library
    - Upload images to Supabase Storage (landing-content/benefits/ path)
    - Generate unique filenames using UUIDs
    - Save image metadata to benefits data.images array (imageUrl, thumbnailUrl, storagePath, thumbnailPath, displayOrder)
    - Display uploaded images in list with preview
    - _Requirements: 7.1, 7.7, 8.1, 8.2_
  
  - [ ] 17.2 Add image reordering and deletion controls
    - Add drag-and-drop reordering for images in list
    - Add delete button per image
    - Update displayOrder on reorder
    - Delete image from Supabase Storage on deletion
    - Remove image from data.images array
    - Save changes to database
    - _Requirements: 8.1, 8.3, 8.4_
  
  - [ ]* 17.3 Write property test for carousel multi-image upload
    - **Property 10: Carousel multi-image upload**
    - **Validates: Requirements 7.1, 7.7, 8.2**
    - Test multiple images uploaded successfully
    - Test thumbnails generated for each image
    - Test metadata saved with correct display order
    - Test images available in carousel
    - Test file: `app/admin/content/__tests__/benefits-editor.test.tsx`
  
  - [ ]* 17.4 Write property test for carousel image management
    - **Property 12: Carousel image management**
    - **Validates: Requirements 8.1, 8.3, 8.4**
    - Test images can be viewed, added, deleted, and reordered
    - Test deletion removes both database record and storage file
    - Test reordering persists and reflects in public carousel
    - Test file: `app/admin/content/__tests__/benefits-editor.test.tsx`

- [ ] 18. Checkpoint - Verify admin features work end-to-end
  - Ensure all tests pass
  - Manually test voucher creation, editing, deletion in admin UI
  - Manually test benefits image upload, reordering, deletion in admin UI
  - Verify carousel displays images correctly on landing page
  - Verify voucher list displays correct status
  - Ask the user if questions arise

- [ ] 19. End-to-end testing and final integration
  - [ ]* 19.1 Write end-to-end test for complete voucher flow
    - Use Playwright for E2E testing
    - Create voucher via admin UI
    - Apply voucher on cart page as customer
    - Verify discount displayed correctly
    - Navigate to checkout
    - Verify voucher persists and discount shows
    - Complete checkout flow
    - Verify order includes voucher discount in Stripe metadata
    - Test file: `e2e/voucher-flow.spec.ts`
  
  - [ ]* 19.2 Write end-to-end test for benefits carousel flow
    - Upload multiple images via admin UI
    - Verify images saved to Supabase Storage
    - Verify thumbnails generated
    - Load landing page
    - Verify carousel displays all images
    - Verify auto-advance works
    - Verify manual navigation works
    - Delete image via admin UI
    - Verify image removed from carousel
    - Test file: `e2e/benefits-carousel.spec.ts`
  
  - [ ] 19.3 Verify all correctness properties pass
    - Run all property-based tests
    - Run all unit tests
    - Run all integration tests
    - Run all E2E tests
    - Fix any failing tests
    - Ensure 100% coverage on critical paths

- [ ] 20. Final review and deployment preparation
  - Verify database migration is idempotent
  - Review all error handling and edge cases
  - Review security considerations (rate limiting, authentication, input validation)
  - Review performance optimizations (caching, image loading, database indexes)
  - Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
  - Test responsive design on mobile devices
  - Test accessibility (keyboard navigation, screen readers, ARIA labels)
  - Document API endpoints and usage
  - Update README with voucher feature documentation
  - Ensure all tests pass
  - Ask the user if ready to deploy

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation of major feature components
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Integration tests validate component interactions
- E2E tests validate complete user workflows
- Implementation uses TypeScript, Next.js 14, React, Supabase, and Stripe
- Backend changes (database, services, APIs) are implemented first, followed by frontend components
- Admin features are separated from customer-facing features for parallel development
- All API endpoints require proper authentication and authorization
- All user inputs are validated on both client and server
- Session storage is used for voucher persistence across page navigation
- Backward compatibility is maintained for existing benefits section with single image

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5", "3.1"] },
    { "id": 4, "tasks": ["2.6", "3.2", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4"] },
    { "id": 6, "tasks": ["4.5", "6.1"] },
    { "id": 7, "tasks": ["6.2", "7.1"] },
    { "id": 8, "tasks": ["7.2", "8.1"] },
    { "id": 9, "tasks": ["8.2", "9.1"] },
    { "id": 10, "tasks": ["9.2", "11.1", "12.1"] },
    { "id": 11, "tasks": ["11.2", "12.2", "13.1"] },
    { "id": 12, "tasks": ["13.2", "13.3", "14.1"] },
    { "id": 13, "tasks": ["14.2", "15.1"] },
    { "id": 14, "tasks": ["15.2", "15.3"] },
    { "id": 15, "tasks": ["15.4", "15.5", "15.6", "15.7", "16.1"] },
    { "id": 16, "tasks": ["16.2", "17.1"] },
    { "id": 17, "tasks": ["17.2"] },
    { "id": 18, "tasks": ["17.3", "17.4"] },
    { "id": 19, "tasks": ["19.1", "19.2", "19.3"] }
  ]
}
```
