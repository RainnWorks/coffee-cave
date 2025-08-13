import { AuthedZeroProvider } from "../AuthedZeroProvider";
import { Outlet } from "react-router";

export default function Layout({children}: React.PropsWithChildren) {
    console.log('test)')
  return (
    <AuthedZeroProvider
      zeroCacheServer={DMNO_PUBLIC_CONFIG.ZERO_CACHE_SERVER}
      backendServer={DMNO_PUBLIC_CONFIG.BACKEND_BASE_URL}
    >
      <Outlet />
    </AuthedZeroProvider>
  );
}
