import { auth } from "@/auth";
import { ExpenseForm } from "@/components/ExpenseForm";
import { SignInLanding } from "@/components/SignInLanding";

export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <SignInLanding />;
  }

  return (
    <ExpenseForm
      userName={session.user.name}
      initialSpreadsheetId={session.spreadsheetId}
    />
  );
}
