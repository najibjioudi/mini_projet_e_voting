import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("register", "routes/register.tsx"),
  route("login", "routes/login.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("verify-identity", "routes/verify-identity.tsx"),
  route("results", "routes/results.tsx"),
  
  // Admin routes with nested layout
  route("admin", "routes/admin/layout.tsx", [
    index("routes/admin/index.tsx"),
    route("voters", "routes/admin/voters.tsx"),
    route("elections", "routes/admin/elections.tsx"),
    route("electors", "routes/admin/electors.tsx"),
  ]),
] satisfies RouteConfig;