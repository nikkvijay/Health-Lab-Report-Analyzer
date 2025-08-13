/**
 * Global authentication circuit breaker
 * Prevents infinite refresh loops by globally disabling auth attempts
 */

let isCircuitBroken = false;
let breakerTimestamp = 0;
const CIRCUIT_RESET_TIME = 30000; // 30 seconds

export const authCircuitBreaker = {
  /**
   * Check if the auth circuit is currently broken
   */
  isBroken(): boolean {
    // Check if we should reset the circuit
    if (isCircuitBroken && Date.now() - breakerTimestamp > CIRCUIT_RESET_TIME) {
      isCircuitBroken = false;
      breakerTimestamp = 0;
    }
    
    return isCircuitBroken;
  },

  /**
   * Break the circuit to prevent further auth attempts
   */
  break(): void {
    console.error('🚨 AUTH CIRCUIT BREAKER ACTIVATED - Blocking all auth attempts');
    isCircuitBroken = true;
    breakerTimestamp = Date.now();
  },

  /**
   * Manually reset the circuit
   */
  reset(): void {
    isCircuitBroken = false;
    breakerTimestamp = 0;
  },

  /**
   * Get status for debugging
   */
  getStatus(): { isBroken: boolean; timeUntilReset: number } {
    const timeUntilReset = isCircuitBroken 
      ? Math.max(0, CIRCUIT_RESET_TIME - (Date.now() - breakerTimestamp))
      : 0;
      
    return {
      isBroken: isCircuitBroken,
      timeUntilReset
    };
  }
};