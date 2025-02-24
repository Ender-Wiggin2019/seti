/*
 * @Author: Ender-Wiggin
 * @Date: 2023-08-14 10:52:47
 * @LastEditors: Ender-Wiggin
 * @LastEditTime: 2025-02-24 23:37:57
 * @Description:
 */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { i18n } = require('./next-i18next.config');
/** @type {import('next').NextConfig} */

const nextConfig = {
  i18n,

  eslint: {
    dirs: ['src'],
  },

  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ender-picgo.oss-cn-shenzhen.aliyuncs.com',
        port: '',
        pathname: '/img/**',
      },
    ],
  },
  // swcMinify: true,

  // Uncoment to add domain whitelist
  // images: {
  //   domains: [
  //     'res.cloudinary.com',
  //   ],
  // },

  // SVGR
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            typescript: true,
            icon: true,
          },
        },
      ],
    });

    return config;
  },
};

module.exports = nextConfig;
