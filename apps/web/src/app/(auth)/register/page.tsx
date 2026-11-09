import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";
import styles from "@/features/auth/login.module.css";

export default function RegisterPage() {
  return (
    <>
      <RegisterForm />
      <footer className={styles.loginFooter}>
        <p className={styles.footerText}>
          Já tem uma conta? <Link href="/login">Entre aqui</Link>
        </p>
      </footer>
    </>
  );
}
