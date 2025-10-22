# Payments Module – Purpose
Handle Stripe subscription management with EU VAT compliance and webhook processing.

## Features

### Subscription Management
#### Constraints
- **Must** use Stripe Checkout for payment flow
- **Must** handle EU VAT with Stripe Tax
- **Must** support single tier: Pro £14.99/mo
- **Must** include annual discount (~15% off)

#### State / Flow
- User selects plan → Stripe Checkout → Payment success → Update subscription status

### Webhook Processing
#### Constraints
- **Must** verify Stripe webhook signatures
- **Must** handle subscription events (created, updated, cancelled)
- **Must** update user subscription status in real-time
- **Must** log all webhook events

#### State / Flow
- Stripe sends webhook → Verify signature → Process event → Update database → Log result

### Access Control
#### Constraints
- **Must** block workflow access for inactive subscriptions
- **Must** show upgrade prompts for expired users
- **Must** maintain grace period for failed payments (3 days)

#### State / Flow
- User action → Check subscription → Allow/redirect to pricing