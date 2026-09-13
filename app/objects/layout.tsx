import Link from "next/link";
import { signOut } from "@/app/login/actions";

export default function ObjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b border-black/10 dark:border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <Link href="/objects" className="text-sm font-semibold">
            The Hallow Archive
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/objects/graph" className="text-sm text-black/60 underline dark:text-white/60">
              Graph
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
