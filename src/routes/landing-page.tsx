import { Link } from 'react-router';
import { Button } from '@/components/ui/button';

export const LandingPage = () => {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-6 py-16 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">mig-sel</h1>
      <p className="text-muted-foreground">Welcome. Get started by logging in or browsing posts.</p>
      <div className="flex justify-center gap-3">
        <Button asChild>
          <Link to="/login">Log in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
};
