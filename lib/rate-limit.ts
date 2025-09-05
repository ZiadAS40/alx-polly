/**
 * In-memory rate limiting implementation
 * 
 * This module provides a simple rate limiting mechanism to prevent abuse and spam.
 * It uses an in-memory Map to track request counts per identifier within time windows.
 * 
 * Note: For production environments, consider using Redis or a distributed cache
 * to ensure rate limiting works across multiple server instances.
 */

// In-memory storage for rate limiting data
// Key: identifier (user ID, IP address, etc.)
// Value: { count: number, resetTime: number }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Checks if a request should be allowed based on rate limiting rules
 * 
 * This function implements a sliding window rate limiter that tracks requests
 * per identifier within a specified time window. It prevents abuse by limiting
 * the number of requests a single identifier can make within the window period.
 * 
 * @param identifier - Unique identifier for the requester (user ID, IP, etc.)
 * @param maxRequests - Maximum number of requests allowed in the time window (default: 10)
 * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns Rate limit result with success status, remaining requests, and reset time
 * 
 * @example
 * ```typescript
 * // Allow 5 requests per minute for a user
 * const result = rateLimit('user:123', 5, 60000);
 * if (!result.success) {
 *   console.log('Rate limit exceeded. Try again in', result.resetTime - Date.now(), 'ms');
 * }
 * ```
 */
export function rateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000 // 1 minute
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;
  
  // Get current rate limit data for this identifier
  const current = rateLimitMap.get(key);
  
  // If no data exists or the time window has expired, start fresh
  if (!current || now > current.resetTime) {
    // First request or window expired - reset the counter
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    
    return {
      success: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }
  
  // Check if rate limit has been exceeded
  if (current.count >= maxRequests) {
    // Rate limit exceeded - deny the request
    return {
      success: false,
      remaining: 0,
      resetTime: current.resetTime,
    };
  }
  
  // Increment the request count for this identifier
  current.count++;
  rateLimitMap.set(key, current);
  
  return {
    success: true,
    remaining: maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

/**
 * Extracts the client IP address from request headers
 * 
 * This function attempts to get the real client IP address from various headers
 * that are commonly set by reverse proxies and load balancers. It handles
 * the x-forwarded-for header (which may contain multiple IPs) and x-real-ip header.
 * 
 * @param request - The incoming request object
 * @returns The client IP address or 'unknown' if not found
 * 
 * @example
 * ```typescript
 * const clientIP = getClientIP(request);
 * const rateLimitKey = `ip:${clientIP}`;
 * const result = rateLimit(rateLimitKey, 100, 60000); // 100 requests per minute per IP
 * ```
 */
export function getClientIP(request: Request): string {
  // Try to get real IP from headers (for production with reverse proxy)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  // x-forwarded-for may contain multiple IPs (client, proxy1, proxy2)
  // We want the first one (the original client IP)
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  // x-real-ip is a single IP address
  if (realIP) {
    return realIP;
  }
  
  // Fallback to a default identifier if no IP headers are found
  return 'unknown';
}
