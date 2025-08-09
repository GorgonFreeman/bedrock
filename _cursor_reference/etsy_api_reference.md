# Etsy Open API v3 Reference

**Version:** 3.0.0  
**Base URL:** https://openapi.etsy.com  
**Contact:** developers@etsy.com  
**Terms of Service:** https://www.etsy.com/legal/api

## Overview

Etsy's Open API provides a simple RESTful interface for various Etsy.com features. This API supports both API key authentication and OAuth 2.0.

## Authentication

### API Key Authentication
- **Type:** API Key
- **Header:** `x-api-key`
- **Required:** Every request to a v3 API endpoint must include your application's API key

### OAuth 2.0 Authentication
- **Type:** OAuth2
- **Authorization URL:** https://www.etsy.com/oauth/connect
- **Token URL:** https://openapi.etsy.com/v3/public/oauth/token

#### Available Scopes:
- `address_r` - see billing and shipping addresses
- `address_w` - update billing and shipping addresses
- `billing_r` - see all billing statement data
- `cart_r` - read shopping carts
- `cart_w` - add/remove from shopping carts
- `email_r` - read a user profile
- `favorites_r` - see private favorites
- `favorites_w` - add/remove favorites
- `feedback_r` - see purchase info in feedback
- `listings_d` - delete listings
- `listings_r` - see all listings (including expired etc)
- `listings_w` - create/edit listings
- `profile_r` - see all profile data
- `profile_w` - update user profile, avatar, etc
- `recommend_r` - see recommended listings
- `recommend_w` - accept/reject recommended listings
- `shops_r` - see private shop info
- `shops_w` - update shop
- `transactions_r` - see all checkout/payment data
- `transactions_w` - update receipts

## API Endpoints

### Authentication
- `GET /v3/public/oauth/token` - OAuth token endpoint

### Buyer Taxonomy
- `GET /v3/application/buyer-taxonomy/nodes` - Get buyer taxonomy nodes
- `GET /v3/application/buyer-taxonomy/nodes/{taxonomy_id}/properties` - Get properties by buyer taxonomy ID

### Seller Taxonomy
- `GET /v3/application/seller-taxonomy/nodes` - Get seller taxonomy nodes
- `GET /v3/application/seller-taxonomy/nodes/{taxonomy_id}/properties` - Get properties by taxonomy ID

### Listing Management

#### Shop Listing
- `POST /v3/application/listings` - Create draft listing
- `GET /v3/application/shops/{shop_id}/listings` - Get listings by shop
- `DELETE /v3/application/listings/{listing_id}` - Delete listing
- `GET /v3/application/listings/{listing_id}` - Get listing
- `GET /v3/application/listings/active` - Find all active listings
- `GET /v3/application/shops/{shop_id}/listings/active` - Find all active listings by shop
- `GET /v3/application/listings/batch` - Get listings by listing IDs
- `GET /v3/application/shops/{shop_id}/listings/featured` - Get featured listings by shop
- `PATCH /v3/application/listings/{listing_id}` - Update listing

#### Listing Properties
- `DELETE /v3/application/listings/{listing_id}/properties/{property_id}` - Delete listing property
- `PUT /v3/application/listings/{listing_id}/properties/{property_id}` - Update listing property
- `GET /v3/application/listings/{listing_id}/properties/{property_id}` - Get listing property
- `GET /v3/application/listings/{listing_id}/properties` - Get listing properties

#### Listing Files
- `DELETE /v3/application/listings/{listing_id}/files/{listing_file_id}` - Delete listing file
- `GET /v3/application/listings/{listing_id}/files/{listing_file_id}` - Get listing file
- `GET /v3/application/listings/{listing_id}/files` - Get all listing files
- `POST /v3/application/listings/{listing_id}/files` - Upload listing file

#### Listing Images
- `DELETE /v3/application/listings/{listing_id}/images/{listing_image_id}` - Delete listing image
- `GET /v3/application/listings/{listing_id}/images/{listing_image_id}` - Get listing image
- `GET /v3/application/listings/{listing_id}/images` - Get listing images
- `POST /v3/application/listings/{listing_id}/images` - Upload listing image

#### Listing Inventory
- `GET /v3/application/listings/{listing_id}/inventory` - Get listing inventory
- `PUT /v3/application/listings/{listing_id}/inventory` - Update listing inventory

#### Listing Videos
- `DELETE /v3/application/listings/{listing_id}/videos/{listing_video_id}` - Delete listing video
- `GET /v3/application/listings/{listing_id}/videos/{listing_video_id}` - Get listing video
- `GET /v3/application/listings/{listing_id}/videos` - Get listing videos
- `POST /v3/application/listings/{listing_id}/videos` - Upload listing video

#### Listing Translations
- `POST /v3/application/listings/{listing_id}/translations/{language}` - Create listing translation
- `GET /v3/application/listings/{listing_id}/translations/{language}` - Get listing translation
- `PUT /v3/application/listings/{listing_id}/translations/{language}` - Update listing translation

### Shop Management

#### Shop
- `GET /v3/application/shops/{shop_id}` - Get shop
- `PUT /v3/application/shops/{shop_id}` - Update shop
- `GET /v3/application/users/{user_id}/shops` - Get shop by owner user ID
- `GET /v3/application/shops` - Find shops

#### Shop Sections
- `POST /v3/application/shops/{shop_id}/sections` - Create shop section
- `GET /v3/application/shops/{shop_id}/sections` - Get shop sections
- `DELETE /v3/application/shops/{shop_id}/sections/{shop_section_id}` - Delete shop section
- `GET /v3/application/shops/{shop_id}/sections/{shop_section_id}` - Get shop section
- `PUT /v3/application/shops/{shop_id}/sections/{shop_section_id}` - Update shop section

#### Shop Return Policies
- `POST /v3/application/shops/{shop_id}/policies/return` - Create shop return policy
- `GET /v3/application/shops/{shop_id}/policies/return` - Get shop return policies
- `DELETE /v3/application/shops/{shop_id}/policies/return/{return_policy_id}` - Delete shop return policy
- `GET /v3/application/shops/{shop_id}/policies/return/{return_policy_id}` - Get shop return policy
- `PUT /v3/application/shops/{shop_id}/policies/return/{return_policy_id}` - Update shop return policy

### Shipping Management

#### Shop Shipping Profiles
- `GET /v3/application/shipping/carriers` - Get shipping carriers
- `POST /v3/application/shops/{shop_id}/shipping-profiles` - Create shop shipping profile
- `GET /v3/application/shops/{shop_id}/shipping-profiles` - Get shop shipping profiles
- `DELETE /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}` - Delete shop shipping profile
- `GET /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}` - Get shop shipping profile
- `PUT /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}` - Update shop shipping profile

#### Shop Shipping Profile Destinations
- `POST /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/destinations` - Create shop shipping profile destination
- `GET /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/destinations` - Get shop shipping profile destinations
- `DELETE /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/destinations/{shipping_profile_destination_id}` - Delete shop shipping profile destination
- `PUT /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/destinations/{shipping_profile_destination_id}` - Update shop shipping profile destination

#### Shop Shipping Profile Upgrades
- `POST /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/upgrades` - Create shop shipping profile upgrade
- `GET /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/upgrades` - Get shop shipping profile upgrades
- `DELETE /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/upgrades/{shipping_profile_upgrade_id}` - Delete shop shipping profile upgrade
- `PUT /v3/application/shops/{shop_id}/shipping-profiles/{shipping_profile_id}/upgrades/{shipping_profile_upgrade_id}` - Update shop shipping profile upgrade

### Receipt Management

#### Shop Receipts
- `GET /v3/application/shops/{shop_id}/receipts/{receipt_id}` - Get shop receipt
- `PUT /v3/application/shops/{shop_id}/receipts/{receipt_id}` - Update shop receipt
- `GET /v3/application/shops/{shop_id}/receipts` - Get shop receipts
- `POST /v3/application/shops/{shop_id}/receipts/{receipt_id}/tracking` - Create receipt shipment

#### Shop Receipt Transactions
- `GET /v3/application/shops/{shop_id}/transactions` - Get shop receipt transactions by shop
- `GET /v3/application/shops/{shop_id}/receipts/{receipt_id}/transactions` - Get shop receipt transactions by receipt
- `GET /v3/application/shops/{shop_id}/receipts/{receipt_id}/transactions/{transaction_id}` - Get shop receipt transaction
- `GET /v3/application/shops/{shop_id}/listings/{listing_id}/transactions` - Get shop receipt transactions by listing

### Payment Management

#### Shop Payment Account Ledger
- `GET /v3/application/shops/{shop_id}/payment-account/ledger-entries/{ledger_entry_id}` - Get shop payment account ledger entry
- `GET /v3/application/shops/{shop_id}/payment-account/ledger-entries` - Get shop payment account ledger entries

#### Payments
- `GET /v3/application/payment-account/ledger-entries/{ledger_entry_id}/payments` - Get payment account ledger entry payments
- `GET /v3/application/shops/{shop_id}/receipts/{receipt_id}/payments` - Get shop payment by receipt ID
- `GET /v3/application/payments` - Get payments

### Review Management

#### Reviews
- `GET /v3/application/listings/{listing_id}/reviews` - Get reviews by listing
- `GET /v3/application/shops/{shop_id}/reviews` - Get reviews by shop

### User Management

#### User
- `GET /v3/application/users/{user_id}` - Get user
- `GET /v3/application/users/me` - Get me

#### User Addresses
- `DELETE /v3/application/users/{user_id}/addresses/{user_address_id}` - Delete user address
- `GET /v3/application/users/{user_id}/addresses/{user_address_id}` - Get user address
- `GET /v3/application/users/{user_id}/addresses` - Get user addresses

### Other
- `GET /v3/application/openapi-ping` - Ping
- `POST /v3/application/oauth/scopes` - Token scopes

## Support

For issues or feedback on the API design, please add an issue in [GitHub](https://github.com/etsy/open-api/discussions).

---

© 2021-2025 Etsy, Inc. All Rights Reserved. Use of this code is subject to Etsy's [API Developer Terms of Use](https://www.etsy.com/legal/api). 