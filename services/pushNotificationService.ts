// Push notifications disabled for non-development builds
export const pushNotificationService = {
  async registerForPushNotifications(_userId: string) {
    // No-op: Push notifications disabled
  },

  async sendNotificationToUser(
    _recipientUserId: string,
    _title: string,
    _body: string,
    _data?: any,
  ) {
    // No-op: Push notifications disabled
  },
};
