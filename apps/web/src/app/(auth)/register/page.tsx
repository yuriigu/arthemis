import { UserForm } from "@/components/ui/form/UserForm";
import { ThemeToggle } from "@/components/theme-toggle";

export default function RegisterPage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-10">
      <div className="absolute right-4 top-4"><ThemeToggle /></div>
      <UserForm proponents={[]} />
      <p className="mt-4 text-center text-sm text-muted-foreground">Cadastro aguardando organizações e ação de integração com a API.</p>
    </main>
  );
}