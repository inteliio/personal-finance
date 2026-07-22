import { auth } from "@/auth";
import { SignInLanding } from "@/components/SignInLanding";
import { TransactionsList } from "@/components/TransactionsList";

export default async function TransactionsPage() {
  const session = await auth();

  if (!session?.user) {
    return <SignInLanding />;
  }

  return <TransactionsList userName={session.user.name} />;
}
