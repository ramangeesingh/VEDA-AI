import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MainLayout from "@/components/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Mail, Lock, LogIn, UserPlus } from "lucide-react";

const mascotUrl = "https://cdn.builder.io/api/v1/image/assets%2F39ee7dd62eee466082afcbad8171f571%2F77199b25987844ab938408565f3aab51?format=webp&width=800";

export default function Auth() {
  const { user, loading, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  // Form states
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState("");
  
  const [actionLoading, setActionLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectPath);
    }
  }, [user, loading, navigate, redirectPath]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) return;
    setActionLoading(true);
    await signInWithEmail(signInEmail, signInPassword);
    setActionLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (!signUpEmail || !signUpPassword) return;
    if (signUpPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setActionLoading(true);
    await signUpWithEmail(signUpEmail, signUpPassword);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-veda-sky border-t-transparent"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-12 lg:grid-cols-12 items-center">
          {/* Mascot side */}
          <div className="lg:col-span-5 text-center lg:text-left space-y-6">
            <div className="relative inline-block">
              <img
                src={mascotUrl}
                alt="Veda mascot"
                className="w-48 sm:w-56 lg:w-64 mx-auto animate-float drop-shadow-2xl"
              />
              <div className="absolute -right-4 -top-6 lg:-right-8 lg:-top-10 w-48 rounded-2xl bg-white dark:bg-card text-veda-primary-ink dark:text-foreground shadow-soft-lg p-4 border border-border animate-bubble-in z-20">
                <p className="text-xs sm:text-sm font-semibold">
                  "Let's get you signed in to save your XP, badges, and learning progress!"
                </p>
                <span className="hidden lg:block absolute -left-2 top-1/2 -translate-y-1/2 h-3 w-3 rotate-45 bg-white dark:bg-card border-l border-b border-border" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-veda-yellow px-3 py-1 text-xs font-semibold text-veda-primary-ink shadow-soft">
                <Sparkles size={14} className="text-veda-coral" /> Unlock Full Access
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                Ready to level up with <span className="text-veda-coral">Veda</span>?
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto lg:mx-0">
                Sign in to save your custom practice configurations, continue adaptive tests from where you left off, and challenge your classmates!
              </p>
            </div>
          </div>

          {/* Form side */}
          <div className="lg:col-span-7 max-w-md w-full mx-auto">
            <Card className="shadow-soft-lg border-border/80 overflow-hidden bg-card/65 backdrop-blur-md">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
                <CardDescription>Choose your preferred authentication method</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Google OAuth Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={signInWithGoogle}
                  disabled={actionLoading}
                  className="w-full flex items-center justify-center gap-3 h-11 border-border rounded-2xl bg-background hover:bg-muted/50 hover:shadow-soft transition-all font-semibold active:scale-98"
                >
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink mx-4 text-muted-foreground text-xs font-semibold uppercase">Or email</span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 rounded-2xl p-1 bg-muted">
                    <TabsTrigger value="login" className="rounded-xl py-2 text-sm font-semibold transition-all">
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger value="register" className="rounded-xl py-2 text-sm font-semibold transition-all">
                      Sign Up
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="login" className="mt-4">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-email"
                            placeholder="you@example.com"
                            type="email"
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                            required
                            className="pl-10 h-10 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password">Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signin-password"
                            type="password"
                            placeholder="••••••••"
                            value={signInPassword}
                            onChange={(e) => setSignInPassword(e.target.value)}
                            required
                            className="pl-10 h-10 rounded-xl"
                          />
                        </div>
                      </div>
                      <Button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full h-11 rounded-2xl bg-veda-sky hover:bg-veda-sky/90 text-white font-semibold transition-all active:scale-98"
                      >
                        {actionLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Signing In...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <LogIn size={16} /> Sign In
                          </span>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  <TabsContent value="register" className="mt-4">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-email">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-email"
                            placeholder="you@example.com"
                            type="email"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            required
                            className="pl-10 h-10 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password">Password (min 6 characters)</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-password"
                            type="password"
                            placeholder="••••••••"
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            required
                            className="pl-10 h-10 rounded-xl"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-confirm-password"
                            type="password"
                            placeholder="••••••••"
                            value={signUpConfirmPassword}
                            onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                            required
                            className="pl-10 h-10 rounded-xl"
                          />
                        </div>
                      </div>
                      {passwordError && (
                        <p className="text-xs font-semibold text-destructive">{passwordError}</p>
                      )}
                      <Button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full h-11 rounded-2xl bg-veda-coral hover:bg-veda-coral/90 text-white font-semibold transition-all active:scale-98"
                      >
                        {actionLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Registering...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <UserPlus size={16} /> Create Account
                          </span>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter className="text-center justify-center text-xs text-muted-foreground border-t border-border/40 py-3 bg-muted/20">
                By continuing, you agree to Veda's Terms and Privacy Policy.
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
