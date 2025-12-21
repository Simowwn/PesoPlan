import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  ArrowRight, 
  TrendingUp, 
  PieChart, 
  Shield,
  Loader2
} from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
              <Wallet className="h-5 w-5 text-background" />
            </div>
            <span className="text-xl font-semibold tracking-tight">SaveWise</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <div className="animate-fade-in space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent text-sm font-medium">
              <span className="h-2 w-2 rounded-full bg-foreground animate-pulse" />
              Smart budgeting made simple
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              Take control of your
              <br />
              <span className="text-muted-foreground">financial future</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Track income, manage expenses, and build savings with the proven 
              Needs-Wants-Savings budgeting method. Clean, simple, effective.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="xl" asChild>
                <Link to="/auth">
                  Start for Free
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight mb-4">
              Everything you need to budget smarter
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple yet powerful tools to help you understand where your money goes 
              and make better financial decisions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-border bg-card hover:shadow-elevated transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-6">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Everything</h3>
              <p className="text-muted-foreground text-sm">
                Log income from multiple sources and track every expense with categories 
                and recurring payment support.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card hover:shadow-elevated transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-6">
                <PieChart className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Allocation</h3>
              <p className="text-muted-foreground text-sm">
                Use proven budgeting rules to automatically allocate income to Needs, 
                Wants, and Savings categories.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-border bg-card hover:shadow-elevated transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mb-6">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Build Savings</h3>
              <p className="text-muted-foreground text-sm">
                Watch your savings grow automatically as you follow your budget plan 
                and reach your financial goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 border-t border-border">
        <div className="container max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Ready to start saving?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of users who have taken control of their finances with SaveWise.
          </p>
          <Button size="lg" asChild>
            <Link to="/auth">
              Create Free Account
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <Wallet className="h-4 w-4 text-background" />
            </div>
            <span className="font-semibold">SaveWise</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SaveWise. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
