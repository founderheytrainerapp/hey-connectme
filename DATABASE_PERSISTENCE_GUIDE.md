# Database Persistence for Cart and Wishlist

This guide explains the implementation of database persistence for cart and wishlist functionality in the Hey Trainer app.

## Overview

The cart and wishlist functionality has been updated to persist data in the database instead of relying solely on local storage. This ensures data consistency across devices and sessions.

## Key Changes

### 1. API Endpoints

#### Cart API (`src/api/cart.ts`)

- `getCart()` - Fetch user's cart from database
- `addToCart(item)` - Add item to cart in database
- `updateCartItem(productId, quantity)` - Update item quantity in database
- `removeFromCart(productId)` - Remove item from cart in database
- `clearCart()` - Clear entire cart in database
- `syncCart(localItems)` - Sync local cart with database

#### Wishlist API (`src/api/wishlist.ts`)

- `getWishlist()` - Fetch user's wishlist from database
- `addToWishlist(item)` - Add item to wishlist in database
- `removeFromWishlist(productId)` - Remove item from wishlist in database
- `isInWishlist(productId)` - Check if item is in wishlist
- `syncWishlist(localItems)` - Sync local wishlist with database

### 2. Store Updates

#### Cart Store (`src/store/cartStore.ts`)

- Added async operations for all cart functions
- Implemented optimistic updates for better UX
- Added loading states and error handling
- Automatic sync with database on operations
- Fallback to local storage as backup

#### Wishlist Store (`src/store/wishlistStore.tsx`)

- Added async operations for all wishlist functions
- Implemented optimistic updates
- Added loading states and error handling
- Automatic sync with database on operations
- Fallback to local storage as backup

### 3. Component Updates

#### ProductCard Component

- Updated to handle async wishlist operations
- Added error handling for wishlist toggle

#### Product Detail Page

- Updated cart operations to be async
- Added error handling for cart operations
- Updated wishlist toggle to be async

#### Wishlist Page

- Updated cart operations to be async
- Added error handling

### 4. Initialization

#### Cart Initialization Hook (`src/hooks/useCartInitialization.ts`)

- Automatically loads cart and wishlist data when user logs in
- Syncs local data with database
- Handles user authentication state changes

#### App Layout Integration

- Added cart initialization to main app layout
- Ensures data is loaded when app starts

## Backend API Requirements

The following API endpoints need to be implemented on the backend:

### Cart Endpoints

```
GET /cart - Get user's cart
POST /cart/items - Add item to cart
PUT /cart/items - Update cart item quantity
DELETE /cart/items/:productId - Remove item from cart
DELETE /cart - Clear entire cart
POST /cart/sync - Sync local cart with database
```

### Wishlist Endpoints

```
GET /wishlist - Get user's wishlist
POST /wishlist/items - Add item to wishlist
DELETE /wishlist/items/:productId - Remove item from wishlist
GET /wishlist/items/:productId/check - Check if item is in wishlist
POST /wishlist/sync - Sync local wishlist with database
```

## Data Models

### Cart Item

```typescript
interface CartItem {
  _id?: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  variant: string;
  category?: string;
  discount?: number;
}
```

### Wishlist Item

```typescript
interface WishlistItem {
  id: string;
  title: string;
  price: number;
  image: string;
}
```

## Error Handling

- All operations include try-catch blocks
- Optimistic updates with rollback on failure
- Error states are tracked in stores
- User feedback for failed operations

## Loading States

- Loading indicators during database operations
- Prevents duplicate operations while loading
- Graceful handling of network issues

## Offline Support

- Local storage is maintained as backup
- Data syncs when connection is restored
- Graceful degradation when offline

## Usage Examples

### Adding to Cart

```typescript
const { addItem, isLoading, error } = useCartStore();

const handleAddToCart = async () => {
  try {
    await addItem({
      _id: product._id,
      title: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
      variant: "color:red-size:large",
    });
    // Success feedback
  } catch (error) {
    // Handle error
  }
};
```

### Adding to Wishlist

```typescript
const { addToWishlist, isLoading, error } = useWishlistStore();

const handleAddToWishlist = async () => {
  try {
    await addToWishlist({
      id: product._id,
      title: product.name,
      price: product.price,
      image: product.image,
    });
    // Success feedback
  } catch (error) {
    // Handle error
  }
};
```

## Testing

To test the implementation:

1. **Login/Logout Test**: Verify cart and wishlist persist across sessions
2. **Cross-device Test**: Verify data syncs across different devices
3. **Network Test**: Test offline/online scenarios
4. **Error Test**: Test error handling and recovery
5. **Performance Test**: Test with large cart/wishlist data

## Migration Notes

- Existing local storage data will be synced to database on first load
- No data loss during migration
- Backward compatibility maintained
- Gradual rollout recommended

## Future Enhancements

- Real-time sync across devices
- Conflict resolution for simultaneous edits
- Advanced offline support
- Analytics and tracking
- Bulk operations optimization
