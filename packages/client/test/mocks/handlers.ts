import { HttpResponse, http } from 'msw';

export const handlers = [
  http.get('http://localhost:3000/health', () => {
    return HttpResponse.json({ ok: true });
  }),
];
