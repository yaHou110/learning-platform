import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage(): JSX.Element {
  return (
    <main dir="rtl" lang="fa" className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">ورود</h1>
      <LoginForm />
      {process.env.NODE_ENV !== 'production' ? (
        <p className="mt-6 text-xs text-gray-500">
          حساب نمونه: مرکز <code>demo</code>، ایمیل <code>admin@lp.local</code>، رمز <code>changeme</code>
        </p>
      ) : null}
    </main>
  );
}
