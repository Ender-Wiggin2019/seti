export function url(path = '') {
  const baseUrl =
    process.env.NODE_ENV === 'production'
      ? 'https://seti.ender-wiggin.com'
      : 'http://localhost:3000';

  return new URL(path, baseUrl);
}
