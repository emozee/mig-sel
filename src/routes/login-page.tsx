import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useSignInWithPassword } from '@/features/auth/api/use-sign-in-with-password';
import { useSignInWithGoogle } from '@/features/auth/api/use-sign-in-with-google';
import { signInSchema, type SignInValues } from '@/features/auth/schemas/sign-in-schema';

const LeafIcon = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-primary"
  >
    <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z" />
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
  </svg>
);

export const LoginPage = () => {
  const navigate = useNavigate();
  const signIn = useSignInWithPassword();
  const signInWithGoogle = useSignInWithGoogle();

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: SignInValues) => {
    signIn.mutate(values, {
      onSuccess: () => navigate('/'),
    });
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center bg-background p-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="bg-primary/5 absolute -left-48 -top-48 size-[36rem] rounded-full blur-3xl" />
        <div className="bg-secondary/20 absolute -bottom-48 -right-48 size-[36rem] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-16 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <LeafIcon />
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            mig-sel
          </h1>
          <p className="text-muted-foreground/60 mt-1.5 text-xs tracking-wide uppercase">
            GMC Resonance
          </p>
        </div>

        <Card>
          <CardHeader className="mb-2">
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          autoComplete="email"
                          placeholder="you@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          placeholder="Enter your password"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {signIn.isError ? (
                  <div className="rounded-sm bg-destructive/10 px-3 py-2">
                    <p className="text-destructive text-sm">{signIn.error.message}</p>
                  </div>
                ) : null}

                <Button type="submit" className="w-full hover:scale-105 hover:shadow-lg" disabled={signIn.isPending}>
                  {signIn.isPending ? 'Signing in\u2026' : 'Sign in'}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase tracking-wide">
                <span className="bg-card text-muted-foreground px-3">or continue with</span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full hover:scale-105 hover:shadow-lg"
                disabled={signInWithGoogle.isPending}
                onClick={() => signInWithGoogle.mutate()}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-2 shrink-0"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
                    fill="#EA4335"
                  />
                </svg>
                {signInWithGoogle.isPending ? 'Redirecting\u2026' : 'Google'}
              </Button>
            </div>
            {signInWithGoogle.isError ? (
              <p className="text-destructive text-sm">{signInWithGoogle.error.message}</p>
            ) : null}

            <p className="text-muted-foreground text-center text-sm">
              No account yet?{' '}
              <Link
                to="/sign-up"
                className="font-semibold text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Create one
              </Link>
            </p>

            <p className="text-muted-foreground/40 text-center text-xs">
              <Link to="/" className="hover:text-muted-foreground/70">
                &larr; Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
