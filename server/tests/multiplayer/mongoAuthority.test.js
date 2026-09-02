'use strict';

const { MongoRequiredRoomRepository, createMultiplayerPlatform } = require('../../multiplayer/platform');

describe('multiplayer Mongo authority', () => {
  it('fails closed instead of switching to ephemeral persistence when Mongo is unavailable', async () => {
    const repository = new MongoRequiredRoomRepository({
      connection: { readyState: 0 },
      repository: { findByCode: jest.fn() },
    });

    await expect(Promise.resolve().then(() => repository.findByCode('MJ-TEST'))).rejects.toMatchObject({
      code: 'MULTIPLAYER_SERVER_UNAVAILABLE',
      status: 503,
      retryable: true,
    });
  });

  it('delegates to Mongo only while the connection is ready', async () => {
    const mongoRepository = { findByCode: jest.fn().mockResolvedValue({ roomCode: 'MJ-TEST' }) };
    const connection = { readyState: 1 };
    const repository = new MongoRequiredRoomRepository({ connection, repository: mongoRepository });

    await expect(repository.findByCode('MJ-TEST')).resolves.toEqual({ roomCode: 'MJ-TEST' });
    connection.readyState = 0;
    await expect(Promise.resolve().then(() => repository.findByCode('MJ-TEST'))).rejects.toHaveProperty('status', 503);
    expect(mongoRepository.findByCode).toHaveBeenCalledTimes(1);
  });

  it('advertises the default runtime as Mongo-required', () => {
    const platform = createMultiplayerPlatform({ repository: { findByCode: jest.fn() }, analytics: null });
    expect(platform.readiness.mode).toBe('mongo-required');
  });
});
