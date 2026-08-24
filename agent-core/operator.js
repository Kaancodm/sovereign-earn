"use strict";

const { STATES } = require("./approval");

class OperatorSurface {
  constructor({ approvalStore }) {
    if (!approvalStore) throw new TypeError("approvalStore is required");
    this.approvalStore = approvalStore;
  }

  getApproval(approvalId) {
    const approval = this.approvalStore.get(approvalId);
    if (!approval) return null;
    return Object.freeze({ ...approval });
  }

  approve(approvalId, actorId) {
    return this.approvalStore.approve(approvalId, actorId);
  }

  reject(approvalId) {
    return this.approvalStore.reject(approvalId);
  }

  status(approvalId) {
    const approval = this.approvalStore.get(approvalId);
    return Object.freeze({ approvalId, state: approval?.state || null, actionable: approval?.state === STATES.PENDING });
  }
}

module.exports = { OperatorSurface };
