import type { NextConfig } from "next";
const nextConfig: NextConfig = {
 reactStrictMode:true,
 eslint:{ignoreDuringBuilds:false},
 typescript:{ignoreBuildErrors:false},
 output:"standalone",
 transpilePackages:["motion"],
 async headers(){const scriptSrc = process.env.NODE_ENV !== "production" ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'"; return [{source:"/:path*",headers:[
  {key:"X-Content-Type-Options",value:"nosniff"},
  {key:"X-Frame-Options",value:"DENY"},
  {key:"Referrer-Policy",value:"strict-origin-when-cross-origin"},
  {key:"Permissions-Policy",value:"camera=(self), geolocation=(self), microphone=()"},
  {key:"Strict-Transport-Security",value:"max-age=31536000"},
  {key:"Content-Security-Policy",value:`default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; ${scriptSrc}; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`}
 ]}]},
 webpack:(config,{dev})=>{if(dev&&process.env.DISABLE_HMR==="true")config.watchOptions={ignored:/.*/};return config;}
};
export default nextConfig;
