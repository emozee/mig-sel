import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useSignInWithGoogle } from '@/features/auth/api/use-sign-in-with-google';

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

export const LandingPage = () => {
  const signInWithGoogle = useSignInWithGoogle();

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
            <CardTitle className="text-white">Welcome back</CardTitle>
            <CardDescription className="text-white/70">
              Sign in with your Google account to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              type="button"
              variant="outline"
              className="w-full border-white/30 bg-white/10 text-white hover:scale-105 hover:bg-white/20 hover:shadow-lg"
              disabled={signInWithGoogle.isPending}
              onClick={() => signInWithGoogle.mutate()}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="mr-2 shrink-0">
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
              {signInWithGoogle.isPending ? 'Redirecting\u2026' : 'Sign in with Google'}
            </Button>

            {signInWithGoogle.isError ? (
              <p className="text-destructive text-sm">{signInWithGoogle.error.message}</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
