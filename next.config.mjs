/** @type {import('next').NextConfig} */
const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const nextConfig = {
  images: {
    remotePatterns:
      supabaseUrl.length > 0
        ? [
            {
              protocol: "https",
              hostname: new URL(supabaseUrl).hostname,
              pathname: "/storage/v1/object/public/**",
            },
          ]
        : [],
  },
};

export default nextConfig;

