import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        }),
        CredentialsProvider({
            name: "Demo User",
            credentials: {
                username: { label: "Username", type: "text", placeholder: "demo" },
            },
            async authorize(credentials, req) {
                // Return a mock user for any credentials suitable for testing
                return { id: "demo-user-1", name: "Demo User", email: "demo@example.com" };
            }
        })
    ],
    callbacks: {
        async session({ session, token }) {
            if (session.user) {
                // @ts-ignore
                session.user.id = token.sub;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    }
};
