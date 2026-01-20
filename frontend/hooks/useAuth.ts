import { useSession } from "next-auth/react";

export function useAuth() {
    const { data: session } = useSession();
    return {
        user: session?.user as { id?: string; name?: string; email?: string; image?: string } | undefined,
        session,
    };
}
