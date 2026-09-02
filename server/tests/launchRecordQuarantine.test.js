'use strict';

const mockReleaseQuery = {
  sort: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  lean: jest.fn().mockResolvedValue([]),
};
const mockFindReleases = jest.fn(() => mockReleaseQuery);

jest.mock('../models/ReleaseVersion', () => ({ find: mockFindReleases }));
jest.mock('../models/TestExecution', () => ({ find: jest.fn() }));
jest.mock('../models/DeploymentHistory', () => ({ find: jest.fn() }));
jest.mock('../services/launchReadinessService', () => ({ runReadinessAudit: jest.fn() }));

const launchController = require('../controllers/launchController');

describe('launch record quarantine', () => {
  it('excludes the exact legacy demo release from launch evidence without deleting it', async () => {
    const res = { json: jest.fn() };
    const next = jest.fn();

    await launchController.getReleases({}, res, next);

    expect(mockFindReleases).toHaveBeenCalledWith({
      $nor: [{
        version: '6.0.0',
        releaseName: 'MyJourney Enterprise Edition',
        featuresCount: 30,
      }],
    });
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [],
      message: 'No verified release records.',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
