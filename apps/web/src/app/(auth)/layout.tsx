import type { ReactNode } from "react";
import Link from "next/link";
import { Leaf } from "lucide-react";
import { AppHeader } from "@/components/layout/app-header";
import styles from "@/features/auth/login.module.css";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className={styles.loginContainer}>
      <AppHeader className={styles.themeToggle} />
      <div className={styles.loginWrapper}>
        <section className={styles.loginContent}>
          {children}
        </section>

        <aside className={styles.loginBackground}>
          <div className={`${styles.backgroundDecoration} ${styles.decorationOne}`} />
          <div className={`${styles.backgroundDecoration} ${styles.decorationTwo}`} />
          <div className={`${styles.backgroundDecoration} ${styles.decorationThree}`} />
          <div className={styles.backgroundText}>
            <Link href="/" className={styles.panelLogo} aria-label="Arthemis - página inicial">
              <Leaf aria-hidden="true" />
              <span>Arthemis</span>
            </Link>
            <h2>Bem-vindo ao Arthemis</h2>
            <p>Monitore e analise indicadores ambientais com precisão e facilidade.</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
