import Link from "next/link";
import { signOut } from "@/app/login/actions";

export default function BusinessesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/objects" className="text-sm font-semibold">
            The Hallow Archive
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/objects" className="text-sm text-black/60 underline dark:text-white/60">
              Objects
            </Link>
            <Link href="/taverns" className="text-sm text-black/60 underline dark:text-white/60">
              Taverns
            </Link>
            <Link href="/businesses" className="text-sm text-black/60 underline dark:text-white/60">
              Businesses
            </Link>
            <Link href="/npcs" className="text-sm text-black/60 underline dark:text-white/60">
              NPCs
            </Link>
            <Link href="/arcs" className="text-sm text-black/60 underline dark:text-white/60">
              Arcs
            </Link>
            <Link href="/compilations" className="text-sm text-black/60 underline dark:text-white/60">
              Compilations
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="text-sm text-black/60 underline dark:text-white/60"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
