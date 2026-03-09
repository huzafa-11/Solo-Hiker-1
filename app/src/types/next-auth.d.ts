import NextAuth from "next-auth";

// EXPLANATION:
// By default, NextAuth's session only has email and name
// But we want to also access user.id
// So we "extend" (add to) the default types

declare module "next-auth" {
  // Extend the Session interface
  // Session is what you get when you call useSession() or getServerSession()
  interface Session {
    user: {
      id: string;      // ← We add this
      email: string;   // Already exists
      name: string;    // Already exists
    };
  }

  // Extend the User interface
  // User is what's returned from the authorize() function
  interface User {
    id: string;
    email: string;
    name: string;
  }
}

declare module "next-auth/jwt" {
  // Extend the JWT interface
  // JWT is the token that stores user data
  interface JWT {
    id: string;      // ← We add this
    email: string;
    name: string;
  }
}

/*
===========================================
WHY DO WE NEED THIS FILE?
===========================================

WITHOUT THIS FILE:
- session.user.id = ERROR  (TypeScript doesn't know 'id' exists)
- You'd only be able to access email and name

WITH THIS FILE:
- session.user.id = "user_123" (TypeScript knows 'id' exists)
- You can access id, email, and name
*/