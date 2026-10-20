export type UserRole = 'USER' | 'ADMIN';

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  user: User;
  accessToken: string;
  accessTokenExpiresIn: number;
};

export type PaginatedUsers = {
  items: User[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};
