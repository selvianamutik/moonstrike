# Requirements Document

## Introduction

This document defines requirements for adding voucher discount functionality to the checkout system, admin voucher management capabilities, footer contact updates, and image carousel enhancements for the "Why Choose Us" section. The feature enables promotional discount codes that reduce cart totals at checkout, provides admin tools to create and manage vouchers with percentage discounts and expiration dates, updates footer contact information, and transforms the "Why Choose Us" section image into a multi-image carousel similar to the hero banner.

## Glossary

- **Voucher_System**: The subsystem that manages voucher codes, validates them, and calculates discount amounts
- **Cart_Page**: The user-facing page displaying cart items and checkout preparation
- **Checkout_Page**: The page where users finalize their order and make payment
- **Order_Summary**: The component displaying itemized costs, discounts, and total price
- **Admin_Dashboard**: The administrative interface for managing site content and configurations
- **Voucher_Manager**: The admin interface component for creating and managing voucher codes
- **Content_Section**: The admin area for managing landing page content (currently includes hero banners and landing sections)
- **Why_Choose_Us_Section**: The landing page section (also called "Benefits Section") that displays site benefits with an image and benefit items
- **Benefits_Carousel**: The new multi-image carousel component for the Why Choose Us section
- **Footer_Component**: The site-wide footer displaying contact information, links, and social media
- **Voucher_Code**: A unique alphanumeric string that customers can enter to receive a discount
- **Discount_Percentage**: The percentage amount (0-100) by which the voucher reduces the cart total
- **Expiration_Date**: The date and time after which a voucher code becomes invalid
- **Valid_Voucher**: A voucher code that exists, has not expired, and meets all validation criteria
- **Invalid_Voucher**: A voucher code that does not exist, has expired, or fails validation criteria

## Requirements

### Requirement 1: Voucher Input at Checkout

**User Story:** As a customer, I want to enter a voucher code during checkout, so that I can receive promotional discounts on my order.

#### Acceptance Criteria

1. WHEN a user views the Cart_Page, THE Cart_Page SHALL display a voucher code input field
2. WHEN a user enters a Voucher_Code and submits it, THE Voucher_System SHALL validate the Voucher_Code
3. WHEN a Valid_Voucher is applied, THE Order_Summary SHALL display the discount amount in USD and EUR
4. WHEN a Valid_Voucher is applied, THE Order_Summary SHALL display the discounted total price
5. WHEN an Invalid_Voucher is submitted, THE Voucher_System SHALL display an error message indicating the voucher is invalid or expired
6. WHEN a Valid_Voucher is applied, THE Cart_Page SHALL persist the voucher application during the user session
7. WHEN a user proceeds to the Checkout_Page with an applied voucher, THE Checkout_Page SHALL display the voucher discount in the order summary

### Requirement 2: Voucher Discount Calculation

**User Story:** As a customer, I want voucher discounts calculated accurately, so that I pay the correct discounted amount.

#### Acceptance Criteria

1. WHEN a Valid_Voucher is applied, THE Voucher_System SHALL calculate the discount amount as (cart subtotal × Discount_Percentage ÷ 100)
2. WHEN calculating discounts in USD, THE Voucher_System SHALL calculate based on the USD cart subtotal
3. WHEN calculating discounts in EUR, THE Voucher_System SHALL calculate based on the EUR cart subtotal
4. WHEN a discount is calculated, THE Voucher_System SHALL round the discount amount to two decimal places
5. WHEN a Valid_Voucher is applied, THE Order_Summary SHALL display the original subtotal, discount amount, and final total as separate line items

### Requirement 3: Voucher Validation Rules

**User Story:** As a system administrator, I want vouchers validated against expiration dates and existence, so that only valid vouchers provide discounts.

#### Acceptance Criteria

1. WHEN validating a Voucher_Code, THE Voucher_System SHALL verify the code exists in the database
2. WHEN validating a Voucher_Code, THE Voucher_System SHALL verify the current date and time is before the Expiration_Date
3. IF a Voucher_Code does not exist in the database, THEN THE Voucher_System SHALL reject the code as invalid
4. IF the current date and time is after the Expiration_Date, THEN THE Voucher_System SHALL reject the code as expired
5. WHEN a Voucher_Code is rejected, THE Voucher_System SHALL return a specific error message indicating whether the code is invalid or expired

### Requirement 4: Admin Voucher Creation

**User Story:** As an administrator, I want to create voucher codes with custom discount percentages and expiration dates, so that I can run promotional campaigns.

#### Acceptance Criteria

1. WHEN an administrator accesses the Content_Section, THE Admin_Dashboard SHALL display a voucher management option
2. WHEN an administrator creates a voucher, THE Voucher_Manager SHALL require a unique Voucher_Code
3. WHEN an administrator creates a voucher, THE Voucher_Manager SHALL require a Discount_Percentage between 0 and 100
4. WHEN an administrator creates a voucher, THE Voucher_Manager SHALL require an Expiration_Date
5. WHEN an administrator submits a valid voucher form, THE Voucher_Manager SHALL save the voucher to the database
6. WHEN an administrator enters a Discount_Percentage outside the range 0 to 100, THE Voucher_Manager SHALL display a validation error
7. WHEN an administrator enters a duplicate Voucher_Code, THE Voucher_Manager SHALL display an error indicating the code already exists

### Requirement 5: Admin Voucher Management

**User Story:** As an administrator, I want to view, edit, and delete existing voucher codes, so that I can manage promotional campaigns effectively.

#### Acceptance Criteria

1. WHEN an administrator accesses the Voucher_Manager, THE Voucher_Manager SHALL display a list of all existing vouchers
2. WHEN displaying voucher lists, THE Voucher_Manager SHALL show the Voucher_Code, Discount_Percentage, Expiration_Date, and status for each voucher
3. WHEN an administrator selects a voucher, THE Voucher_Manager SHALL allow editing of the Discount_Percentage and Expiration_Date
4. WHEN an administrator edits a voucher, THE Voucher_Manager SHALL prevent modification of the Voucher_Code
5. WHEN an administrator deletes a voucher, THE Voucher_Manager SHALL remove the voucher from the database
6. WHEN displaying voucher status, THE Voucher_Manager SHALL indicate whether a voucher is active or expired based on the current date

### Requirement 6: Footer Contact Update

**User Story:** As a site visitor, I want to see the Discord contact link in the footer, so that I can reach the site owners through Discord.

#### Acceptance Criteria

1. WHEN a user views any page, THE Footer_Component SHALL display a Discord contact link with the value "moonstrike.pro"
2. WHEN a user clicks the Discord link, THE Footer_Component SHALL open the Discord contact in a new browser tab
3. THE Footer_Component SHALL display the Discord link in the Contact Us section
4. THE Footer_Component SHALL format the Discord link consistently with other social media links

### Requirement 7: Why Choose Us Multi-Image Carousel

**User Story:** As an administrator, I want to upload multiple images for the Why Choose Us section with carousel functionality, so that I can showcase multiple benefits visually.

#### Acceptance Criteria

1. WHEN an administrator edits the Why Choose Us section, THE Content_Section SHALL allow uploading multiple images
2. WHEN multiple images are uploaded, THE Why_Choose_Us_Section SHALL display images in a carousel format similar to the hero banner
3. WHEN displaying the carousel, THE Benefits_Carousel SHALL show navigation arrows for manual image navigation
4. WHEN displaying the carousel, THE Benefits_Carousel SHALL auto-advance to the next image after 6 seconds
5. WHEN a user hovers over the carousel, THE Benefits_Carousel SHALL pause auto-advance
6. WHEN a user manually navigates the carousel, THE Benefits_Carousel SHALL reset the auto-advance timer
7. WHEN uploading images, THE Content_Section SHALL generate thumbnails for each uploaded image
8. THE Benefits_Carousel SHALL display images without preview thumbnails on the side

### Requirement 8: Benefits Carousel Image Management

**User Story:** As an administrator, I want to manage multiple images in the Why Choose Us carousel, so that I can add, remove, and reorder benefit images.

#### Acceptance Criteria

1. WHEN an administrator edits the Why Choose Us section, THE Content_Section SHALL display all uploaded carousel images
2. WHEN an administrator uploads a new image, THE Content_Section SHALL add the image to the carousel image collection
3. WHEN an administrator deletes a carousel image, THE Content_Section SHALL remove the image from the collection and delete it from storage
4. WHEN an administrator reorders carousel images, THE Content_Section SHALL update the display order
5. WHEN no images are uploaded, THE Why_Choose_Us_Section SHALL display a placeholder image
6. WHEN only one image is uploaded, THE Benefits_Carousel SHALL display the single image without navigation arrows or auto-advance

### Requirement 9: Database Schema for Vouchers

**User Story:** As a system, I need to store voucher data persistently, so that vouchers can be validated and managed over time.

#### Acceptance Criteria

1. THE Voucher_System SHALL store voucher records in a database table named "vouchers"
2. THE vouchers table SHALL include a column for the unique Voucher_Code as text
3. THE vouchers table SHALL include a column for Discount_Percentage as a decimal with precision (5,2)
4. THE vouchers table SHALL include a column for Expiration_Date as a timestamp with time zone
5. THE vouchers table SHALL include a column for created_at timestamp
6. THE vouchers table SHALL include a column for created_by administrator reference
7. THE vouchers table SHALL enforce uniqueness constraint on the Voucher_Code column
8. THE vouchers table SHALL enforce a check constraint that Discount_Percentage is between 0 and 100

### Requirement 10: Benefits Carousel Storage Schema

**User Story:** As a system, I need to store multiple images for the Benefits Carousel, so that carousel images persist across sessions.

#### Acceptance Criteria

1. WHEN storing Benefits Carousel data, THE Content_Section SHALL store image data in the existing landing_content table
2. THE landing_content table data column SHALL support an array of image objects for the benefits_section type
3. WHEN storing carousel images, THE Content_Section SHALL store imageUrl, thumbnailUrl, storagePath, and thumbnailPath for each image
4. WHEN storing carousel images, THE Content_Section SHALL store display_order for each image
5. WHEN storing carousel images, THE Content_Section SHALL maintain backward compatibility with existing single-image benefits sections
6. WHEN retrieving Benefits Carousel data, THE Content_Section SHALL return images sorted by display_order

## Notes

- The voucher system should be implemented as a new feature without disrupting existing checkout flow
- Discount calculations should handle currency conversion properly for USD and EUR
- The Benefits Carousel implementation should reuse patterns from the existing hero banner carousel
- Admin voucher management can be placed in the Content section alongside hero banners and landing content
- Consider rate limiting for voucher validation to prevent brute force attacks on voucher codes
- The Discord link format should follow the existing social media link pattern in the Footer_Component
