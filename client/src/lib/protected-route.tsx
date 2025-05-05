import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  component: Component,
  path,
  requiredRole,
}: {
  component: React.ComponentType<any>;
  path: string;
  requiredRole?: "admin" | "user" | "middleman";
}) {
  const { user } = useAuth();
  // console.log("ProtectedRoute user", user);
  if (!user) {
    return <Redirect to="/auth" />;
  }
  console.log(requiredRole === "middleman" && !user.isMiddleman);
  if (requiredRole === "middleman" && !user.isMiddleman) {
    return <Redirect to="/unauthorized" />;
  }
  if (requiredRole === "admin" && !user.isAdmin) {
    console.log("ProtectedRoute user are not allowed", user);
    return <Redirect to="/unauthorized" />;
  }
  return <Route path={path} component={Component} />;
}