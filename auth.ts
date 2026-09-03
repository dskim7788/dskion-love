import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        // Kakao's stable per-user id, used as the sync key for server-side
        // conversation/persona storage.
        token.userId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
