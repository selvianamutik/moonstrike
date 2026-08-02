/**
 * Verify Cloudflare Turnstile token on the server side
 * @param token The token received from the client
 * @returns Promise<{ success: boolean; error?: string }>
 */
export async function verifyTurnstileToken(token: string): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error('TURNSTILE_SECRET_KEY is not configured');
    return { success: false, error: 'Turnstile is not configured on the server' };
  }

  if (!token) {
    return { success: false, error: 'Turnstile token is required' };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      return { 
        success: false, 
        error: 'Turnstile verification failed' 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return { 
      success: false, 
      error: 'Failed to verify Turnstile token' 
    };
  }
}
