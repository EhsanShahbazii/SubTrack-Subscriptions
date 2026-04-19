export interface Subscription {
  id: string;
  name: string;
  expiryDate: string; // ISO 8601 string
  icon: string; // Codicon ID: "sparkle", "server", "book", etc. (defines the group)
  category?: string;
  account?: string;
  startDate?: string;
}

export interface ExpiryCalculation {
  formattedRemaining: string;
  remainingMs: number;
  daysRemaining: number;
  isExpired: boolean;
}

export interface CodiconOption {
  label: string;
  id: string;
  description: string;
}
