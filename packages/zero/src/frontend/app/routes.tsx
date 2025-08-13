import {
  type RouteConfig,
  route,
  index,
  layout,
  prefix,
} from "@react-router/dev/routes";

export default [
  layout("./routes/_layout.tsx", [index("./routes/_index.tsx")]),
] satisfies RouteConfig;
