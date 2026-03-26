import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import BrowserInfo from "@/pages/browser-info";
import { Footer } from "@/components/ui/footer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { BuildVersion } from "@/components/ui/build-version";

function Router() {
  return (
    <Switch>
      <Route path="/" component={BrowserInfo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <ThemeToggle />
        <Router />
        <Footer />
        <Toaster />
        <BuildVersion />
      </div>
    </QueryClientProvider>
  );
}

export default App;
