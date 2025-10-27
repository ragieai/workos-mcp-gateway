// Mock implementation of jose library for testing
export const jwtVerify = jest.fn().mockResolvedValue({
  payload: { sub: "test-user-id" },
});

export const createRemoteJWKSet = jest.fn().mockReturnValue({
  // Mock JWKS set
});
