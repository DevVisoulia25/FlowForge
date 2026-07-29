const RevertRequest = require('../models/RevertRequest');
const Order = require('../models/Order');
const Stage = require('../models/Stage');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// @desc Create Order Revert Request
// @route POST /api/revert-requests
// @access Private (Department or Owner)
const createRevertRequest = async (req, res, next) => {
  try {
    const { orderId, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason for stage revert is required' });
    }

    const order = await Order.findOne({ _id: orderId, companyId: req.companyId })
      .populate('currentStageId')
      .populate('currentDepartmentId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Completed') {
      return res.status(400).json({ message: 'Completed orders cannot be reverted' });
    }

    if (order.status === 'Pending Revert Approval') {
      return res.status(400).json({ message: 'A revert request is already pending for this order' });
    }

    const currentStage = order.currentStageId;
    if (!currentStage) {
      return res.status(400).json({ message: 'Current stage not found' });
    }

    // Find previous stage in workflow orderIndex
    const prevStage = await Stage.findOne({
      companyId: req.companyId,
      orderIndex: { $lt: currentStage.orderIndex }
    }).sort({ orderIndex: -1 });

    if (!prevStage) {
      return res.status(400).json({
        message: 'Cannot revert order. Order is already at the first production stage.'
      });
    }

    const prevDept = await Department.findById(prevStage.departmentId);

    const revertReq = await RevertRequest.create({
      companyId: req.companyId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      requestedBy: req.user._id,
      requestedByName: req.user.name,
      departmentId: order.currentDepartmentId._id || order.currentDepartmentId,
      departmentName: order.currentDepartmentId?.name || 'Department',
      currentStageId: currentStage._id,
      currentStageName: currentStage.name,
      requestedPreviousStageId: prevStage._id,
      requestedPreviousStageName: prevStage.name,
      requestedPreviousDepartmentId: prevDept?._id,
      reason: reason.trim(),
      status: 'Pending'
    });

    // Update order status
    order.status = 'Pending Revert Approval';
    await order.save();

    // Audit Log
    await ActivityLog.create({
      companyId: req.companyId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      action: 'REQUESTED_REVERT',
      userId: req.user._id,
      userName: req.user.name,
      departmentId: order.currentDepartmentId._id || order.currentDepartmentId,
      departmentName: order.currentDepartmentId?.name,
      details: `Requested stage revert for order #${order.orderNumber} from '${currentStage.name}' to '${prevStage.name}'. Reason: ${reason}`
    });

    // Notify Owner
    await Notification.create({
      companyId: req.companyId,
      recipientRole: 'owner',
      title: 'Revert Requested',
      message: `Revert requested for Order #${order.orderNumber} by ${req.user.name}. Reason: "${reason}"`,
      type: 'REVERT_REQUESTED'
    });

    res.status(201).json(revertReq);
  } catch (error) {
    next(error);
  }
};

// @desc Get list of Revert Requests
// @route GET /api/revert-requests
// @access Private
const getRevertRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = { companyId: req.companyId };

    if (status) {
      query.status = status;
    }

    if (req.user.role === 'department') {
      query.departmentId = req.user.departmentId?._id || req.user.departmentId;
    }

    const requests = await RevertRequest.find(query)
      .populate('orderId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    next(error);
  }
};

// @desc Approve Revert Request
// @route POST /api/revert-requests/:id/approve
// @access Private (Owner only)
const approveRevertRequest = async (req, res, next) => {
  try {
    const revertReq = await RevertRequest.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!revertReq) {
      return res.status(404).json({ message: 'Revert request not found' });
    }

    if (revertReq.status !== 'Pending') {
      return res.status(400).json({ message: `Revert request is already ${revertReq.status}` });
    }

    const order = await Order.findById(revertReq.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Linked order not found' });
    }

    revertReq.status = 'Approved';
    revertReq.approvedBy = req.user._id;
    revertReq.approvedByName = req.user.name;
    revertReq.actionDate = new Date();
    await revertReq.save();

    // Revert Order back to requested previous stage & department
    order.currentStageId = revertReq.requestedPreviousStageId;
    if (revertReq.requestedPreviousDepartmentId) {
      order.currentDepartmentId = revertReq.requestedPreviousDepartmentId;
    }
    order.status = 'In Progress';

    // Append history item for revert
    order.stageHistory.push({
      stageId: revertReq.requestedPreviousStageId,
      stageName: revertReq.requestedPreviousStageName,
      departmentId: revertReq.requestedPreviousDepartmentId,
      departmentName: 'Reverted Stage',
      enteredAt: new Date(),
      remarks: `Stage reverted back by owner approval. Reason: ${revertReq.reason}`
    });

    await order.save();

    // Audit Log
    await ActivityLog.create({
      companyId: req.companyId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      action: 'APPROVED_REVERT',
      userId: req.user._id,
      userName: req.user.name,
      details: `Owner APPROVED stage revert for Order #${order.orderNumber} back to '${revertReq.requestedPreviousStageName}'`
    });

    // Notify Department
    await Notification.create({
      companyId: req.companyId,
      recipientRole: 'department',
      recipientDepartmentId: order.currentDepartmentId,
      title: 'Revert Approved',
      message: `Owner approved stage revert for Order #${order.orderNumber}. Order returned to your queue.`,
      type: 'REVERT_APPROVED'
    });

    res.json({ message: 'Revert request approved and order moved back', revertReq, order });
  } catch (error) {
    next(error);
  }
};

// @desc Reject Revert Request
// @route POST /api/revert-requests/:id/reject
// @access Private (Owner only)
const rejectRevertRequest = async (req, res, next) => {
  try {
    const revertReq = await RevertRequest.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!revertReq) {
      return res.status(404).json({ message: 'Revert request not found' });
    }

    if (revertReq.status !== 'Pending') {
      return res.status(400).json({ message: `Revert request is already ${revertReq.status}` });
    }

    const order = await Order.findById(revertReq.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Linked order not found' });
    }

    revertReq.status = 'Rejected';
    revertReq.approvedBy = req.user._id;
    revertReq.approvedByName = req.user.name;
    revertReq.actionDate = new Date();
    await revertReq.save();

    // Restore order status to In Progress (or Delayed if past due)
    order.status = new Date() > new Date(order.dueDate) ? 'Delayed' : 'In Progress';
    await order.save();

    // Audit Log
    await ActivityLog.create({
      companyId: req.companyId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      action: 'REJECTED_REVERT',
      userId: req.user._id,
      userName: req.user.name,
      details: `Owner REJECTED stage revert request for Order #${order.orderNumber}`
    });

    // Notify Department
    await Notification.create({
      companyId: req.companyId,
      recipientRole: 'department',
      recipientDepartmentId: revertReq.departmentId,
      title: 'Revert Rejected',
      message: `Owner rejected stage revert request for Order #${order.orderNumber}. Order remains at stage '${revertReq.currentStageName}'.`,
      type: 'REVERT_REJECTED'
    });

    res.json({ message: 'Revert request rejected', revertReq, order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRevertRequest,
  getRevertRequests,
  approveRevertRequest,
  rejectRevertRequest
};
