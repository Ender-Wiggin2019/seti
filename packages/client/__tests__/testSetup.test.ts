describe('client test setup', () => {
  it('can write localStorage during a test', () => {
    window.localStorage.setItem('setup-storage-leak-check', 'stale');
    expect(window.localStorage.getItem('setup-storage-leak-check')).toBe(
      'stale',
    );
  });

  it('clears localStorage between tests', () => {
    expect(window.localStorage.getItem('setup-storage-leak-check')).toBeNull();
  });
});
