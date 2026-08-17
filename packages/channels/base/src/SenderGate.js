export class SenderGate {
  policy;
  allowedUsers;
  pairingStore;
  constructor(policy, allowedUsers = [], pairingStore) {
    this.policy = policy;
    this.allowedUsers = new Set(allowedUsers);
    this.pairingStore = pairingStore || null;
  }
  replaceAllowedUsers(users) {
    this.allowedUsers = new Set(users);
  }
  isAllowed(senderId) {
    switch (this.policy) {
      case 'open':
        return true;
      case 'allowlist':
        return this.allowedUsers.has(senderId);
      case 'pairing':
        return (
          this.allowedUsers.has(senderId) ||
          this.pairingStore?.isApproved(senderId) === true
        );
      default:
        throw new Error(`Unknown sender policy: ${this.policy}`);
    }
  }
  check(senderId, senderName) {
    switch (this.policy) {
      case 'open':
        return { allowed: true };
      case 'allowlist':
        return { allowed: this.allowedUsers.has(senderId) };
      case 'pairing': {
        // Check static allowlist first
        if (this.allowedUsers.has(senderId)) {
          return { allowed: true };
        }
        // Check dynamic approved list
        if (this.pairingStore?.isApproved(senderId)) {
          return { allowed: true };
        }
        // Generate pairing code
        const result = this.pairingStore?.createRequest(
          senderId,
          senderName || senderId,
        );
        return {
          allowed: false,
          pairing: result ?? { rejected: 'cap_reached' },
        };
      }
      default:
        throw new Error(`Unknown sender policy: ${this.policy}`);
    }
  }
}
//# sourceMappingURL=SenderGate.js.map
