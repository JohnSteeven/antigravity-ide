const unavailable = () => Object.assign(new Error("Production media delivery is not configured."), {
  status: 503,
  code: "MEDIA_PROVIDER_UNAVAILABLE",
});

class LearnMediaProviderService {
  static capability() {
    return {
      providerConfigured: false,
      directUploadAvailable: false,
      adaptiveStreamingAvailable: false,
      signedDeliveryAvailable: false,
      malwareScanningAvailable: false,
    };
  }

  static async createUploadSession() { throw unavailable(); }
  static async issuePlayback() { throw unavailable(); }
  static async issueDownload() { throw unavailable(); }
}

module.exports = LearnMediaProviderService;
