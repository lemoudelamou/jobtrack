import { auth } from "@/auth";
import AppNav from "@/app/components/shell/AppNav";

/*
 * Server wrapper: reads the session and renders the app navigation
 * (a fixed sidebar on wide screens, a top bar + drawer on small ones).
 * Pages keep rendering <Navbar /> as before; app/globals.css offsets the
 * page content whenever the sidebar is present.
 */
export default async function Navbar() {
    const session = await auth();
    const user = session?.user;

    return (
        <AppNav
            user={
                user
                    ? {
                        name: user.name ?? null,
                        email: user.email ?? null,
                        image: user.image ?? null,
                    }
                    : null
            }
        />
    );
}
