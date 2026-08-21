import { auth } from "@/auth";
import { signOutAction } from "@/lib/actions";
import AppShell from "@/components/AppShell";
import LoginScreen from "@/components/LoginScreen";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <LoginScreen />;
  }

  return (
    <AppShell
      userName={session.user.name}
      userImage={session.user.image}
      onSignOut={signOutAction}
    />
  );
}
