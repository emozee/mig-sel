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
import { useSignUp } from '@/features/auth/api/use-sign-up';
import { signUpSchema, type SignUpValues } from '@/features/auth/schemas/sign-up-schema';

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

export const SignUpPage = () => {
  const navigate = useNavigate();
  const signUp = useSignUp();

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (values: SignUpValues) => {
    signUp.mutate(values, {
      onSuccess: () => navigate('/'),
    });
  };

  return (
    <div
      className="relative flex min-h-svh items-center justify-center p-6"
      style={{
        backgroundImage: 'url(/GMC.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-blue-950/40" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex items-center justify-center">
            <LeafIcon />
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">mig-sel</h1>
          <p className="text-muted-foreground/60 mt-1.5 text-xs tracking-wide uppercase">
            GMC Resonance
          </p>
        </div>

        <Card className="border-white/20 bg-white/20 shadow-xl backdrop-blur-xl">
          <CardHeader className="mb-2">
            <CardTitle>Create your account</CardTitle>
            <CardDescription>Sign up with your email and password.</CardDescription>
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
                          autoComplete="new-password"
                          placeholder="At least 8 characters"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {signUp.isError ? (
                  <div className="bg-destructive/10 rounded-sm px-3 py-2">
                    <p className="text-destructive text-sm">{signUp.error.message}</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full hover:scale-105 hover:shadow-lg"
                  disabled={signUp.isPending}
                >
                  {signUp.isPending ? 'Creating account\u2026' : 'Create account'}
                </Button>
              </form>
            </Form>

            <p className="text-muted-foreground text-center text-sm">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4"
              >
                Sign in
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
