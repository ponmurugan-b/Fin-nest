// Email verification service
// Note: In a browser environment, email sending needs to be done through a backend API
// This service generates verification tokens and provides methods to be called from a backend

export const generateVerificationToken = (): string => {
  return crypto.randomUUID() + '-' + Date.now().toString(36);
};

export const generateVerificationUrl = (token: string): string => {
  // For HashRouter, we need to put the token in the hash
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}#/verify/${token}`;
};

// Simple hash function for client-side (for demo purposes)
// In production, use bcrypt on server-side
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};

// Email template for verification
export const getVerificationEmailContent = (userName: string, verificationUrl: string): { subject: string; html: string; text: string } => {
  return {
    subject: 'Verify your FinNest account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="background: #10b981; width: 60px; height: 60px; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 28px; font-weight: bold;">F</span>
          </div>
          <h1 style="color: #1e293b; margin-top: 15px;">Welcome to FinNest!</h1>
        </div>
        
        <p style="color: #475569; font-size: 16px;">Hi${userName ? ' ' + userName : ''},</p>
        
        <p style="color: #475569; font-size: 16px;">
          Thank you for creating a FinNest account. Please verify your email address by clicking the button below:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px;">
          Or copy and paste this link in your browser:<br>
          <a href="${verificationUrl}" style="color: #10b981;">${verificationUrl}</a>
        </p>
        
        <p style="color: #64748b; font-size: 14px;">
          This link will expire in 24 hours.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
          If you didn't create a FinNest account, you can safely ignore this email.
        </p>
      </div>
    `,
    text: `
      Welcome to FinNest!
      
      Hi${userName ? ' ' + userName : ''},
      
      Thank you for creating a FinNest account. Please verify your email address by visiting:
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create a FinNest account, you can safely ignore this email.
    `
  };
};
