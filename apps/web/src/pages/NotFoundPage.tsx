import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8 text-base text-foreground">
      <h1 className="text-2xl font-semibold">404</h1>
      <p>No existe esta página.</p>
      <Link className="text-primary underline underline-offset-4" to="/">
        Volver al inicio
      </Link>
    </main>
  );
}
