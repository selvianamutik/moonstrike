/**
 * Helper functions and components for handling deleted games and services
 */

/**
 * Check if a service's game has been deleted
 */
export function isServiceOrphaned(service: { game_id?: string | null; game_slug?: string | null }): boolean {
  return service.game_id == null || service.game_slug == null
}

/**
 * Check if an order's service has been deleted
 */
export function isOrderServiceDeleted(order: { service_id?: string | null; service_slug?: string | null }): boolean {
  return order.service_id == null || order.service_slug == null
}

/**
 * Get display message for deleted service
 */
export function getDeletedServiceMessage(context: 'order' | 'cart' | 'chat' = 'order'): string {
  switch (context) {
    case 'order':
      return 'This service is no longer available'
    case 'cart':
      return 'Service unavailable (removed)'
    case 'chat':
      return 'Service was deleted'
    default:
      return 'Service unavailable'
  }
}

/**
 * Get display message for deleted game
 */
export function getDeletedGameMessage(context: 'service' | 'chat' = 'service'): string {
  switch (context) {
    case 'service':
      return 'Game unavailable'
    case 'chat':
      return 'Game was deleted'
    default:
      return 'Game unavailable'
  }
}
