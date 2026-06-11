declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
        department: 'MEDIA' | 'EVANGELISM' | 'IT' | 'HR_FINANCE' | null;
        email: string;
      };
    }
  }
}

export {};
