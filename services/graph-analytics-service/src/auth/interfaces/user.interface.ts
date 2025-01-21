export interface User {
  id: string;
  email: string;
  roles: string[];
  // Add other user properties as needed
}

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      roles: string[];
    }
  }
}