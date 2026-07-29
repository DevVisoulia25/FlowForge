const Order = require('../models/Order');
const Stage = require('../models/Stage');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// Helper to calculate if order is delayed based on due date
const checkDelayedStatus = (order) => {
  if (order.status !== 'Completed' && order.dueDate) {
    if (new Date() > new Date(order.dueDate)) {
      return 'Delayed';
    }
  }
  return order.status;
};

// @desc Create new order
// @route POST /api/orders
// @access Private (Owner only)
const createOrder = async (req, res, next) => {
  try {
    const { orderNumber, customerName, productName, quantity, priority, remarks, dueDate } = req.body;

    if (!orderNumber || !customerName || !productName || !quantity || !dueDate) {
      return res.status(400).json({ message: 'Please provide all required order fields' });
    }

    // Check unique order number per company
    const existingOrder = await Order.findOne({ companyId: req.companyId, orderNumber });
    if (existingOrder) {
      return res.status(400).json({ message: `Order number '${orderNumber}' already exists` });
    }

    // Fetch initial production stage (orderIndex = 0)
    const initialStage = await Stage.findOne({ companyId: req.companyId }).sort({ orderIndex: 1 });
    if (!initialStage) {
      return res.status(400).json({
        message: 'No production stages configured. Please configure production stages in setup or settings first.'
      });
    }

    const initialDept = await Department.findById(initialStage.departmentId);
    if (!initialDept) {
      return res.status(400).json({ message: 'Department assigned to initial stage was not found' });
    }

    const order = await Order.create({
      companyId: req.companyId,
      orderNumber,
      customerName,
      productName,
      quantity,
      priority: priority || 'Medium',
      remarks: remarks || '',
      dueDate,
      currentStageId: initialStage._id,
      currentDepartmentId: initialDept._id,
      status: 'In Progress',
      stageHistory: [
        {
          stageId: initialStage._id,
          stageName: initialStage.name,
          departmentId: initialDept._id,
          departmentName: initialDept.name,
          enteredAt: new Date(),
          remarks: 'Order created & placed in initial stage'
        }
      ]
    });

    // Check delay
    const finalStatus = checkDelayedStatus(order);
    if (finalStatus !== order.status) {
      order.status = finalStatus;
      await order.save();
    }

    // Create Activity Log
    await ActivityLog.create({
      companyId: req.companyId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      action: 'ORDER_CREATED',
      userId: req.user._id,
      userName: req.user.name,
      departmentId: initialDept._id,
      departmentName: initialDept.name,
      details: `Created order #${order.orderNumber} for customer '${customerName}'`
    });

    // Notify Department
    await Notification.create({
      companyId: req.companyId,
      recipientRole: 'department',
      recipientDepartmentId: initialDept._id,
      title: 'New Order Received',
      message: `Order #${order.orderNumber} (${productName}) has arrived in ${initialDept.name}`,
      type: 'NEW_ORDER'
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
};

// @desc Get all orders with search & filtering
// @route GET /api/orders
// @access Private
const getOrders = async (req, res, next) => {
  try {
    const { search, status, departmentId } = req.query;

    let query = { companyId: req.companyId };

    // Role-based restriction: Department users only see work assigned to their department
    if (req.user.role === 'department') {
      if (!req.user.departmentId) {
        return res.status(400).json({ message: 'User has no assigned department' });
      }
      query.currentDepartmentId = req.user.departmentId;
    } else if (departmentId) {
      query.currentDepartmentId = departmentId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } }
      ];
    }

    const orders = await Order.find(query)
      .populate('currentStageId', 'name orderIndex')
      .populate('currentDepartmentId', 'name')
      .sort({ createdAt: -1 });

    // Dynamic delay check update
    const updatedOrders = await Promise.all(
      orders.map(async (ord) => {
        const calculatedStatus = checkDelayedStatus(ord);
        if (calculatedStatus !== ord.status && ord.status !== 'Completed') {
          ord.status = calculatedStatus;
          await ord.save();
        }
        return ord;
      })
    );

    res.json(updatedOrders);
  } catch (error) {
    next(error);
  }
};

// @desc Get single order by ID
// @route GET /api/orders/:id
// @access Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('currentStageId', 'name orderIndex')
      .populate('currentDepartmentId', 'name');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc Complete Current Stage & Advance Order
// @route POST /api/orders/:id/complete-stage
// @access Private
const completeStage = async (req, res, next) => {
  try {
    const { remarks } = req.body;
    const order = await Order.findOne({ _id: req.params.id, companyId: req.companyId })
      .populate('currentStageId')
      .populate('currentDepartmentId');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'Completed') {
      return res.status(400).json({ message: 'Order is already marked as Completed' });
    }

    // Verify department permission if user is a department role
    if (req.user.role === 'department' && String(req.user.departmentId._id || req.user.departmentId) !== String(order.currentDepartmentId._id)) {
      return res.status(403).json({ message: 'Your department is not assigned to this order' });
    }

    const currentStage = order.currentStageId;

    // Update active history item
    if (order.stageHistory && order.stageHistory.length > 0) {
      const lastHistoryIndex = order.stageHistory.length - 1;
      order.stageHistory[lastHistoryIndex].completedAt = new Date();
      order.stageHistory[lastHistoryIndex].completedBy = req.user._id;
      order.stageHistory[lastHistoryIndex].completedByName = req.user.name;
      if (remarks) {
        order.stageHistory[lastHistoryIndex].remarks = remarks;
      }
    }

    // Find next stage in workflow by orderIndex
    const nextStage = await Stage.findOne({
      companyId: req.companyId,
      orderIndex: { $gt: currentStage.orderIndex }
    }).sort({ orderIndex: 1 });

    if (nextStage) {
      const nextDept = await Department.findById(nextStage.departmentId);
      order.currentStageId = nextStage._id;
      order.currentDepartmentId = nextDept._id;
      order.status = checkDelayedStatus(order);

      // Append new stage to history
      order.stageHistory.push({
        stageId: nextStage._id,
        stageName: nextStage.name,
        departmentId: nextDept._id,
        departmentName: nextDept.name,
        enteredAt: new Date(),
        remarks: ''
      });

      // Audit Log
      await ActivityLog.create({
        companyId: req.companyId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        action: 'STAGE_COMPLETED',
        userId: req.user._id,
        userName: req.user.name,
        departmentId: order.currentDepartmentId,
        departmentName: currentStage.departmentId ? currentStage.departmentId.name : 'Dept',
        details: `Stage '${currentStage.name}' completed. Order moved to '${nextStage.name}' (${nextDept.name})`
      });

      // Notification to next department
      await Notification.create({
        companyId: req.companyId,
        recipientRole: 'department',
        recipientDepartmentId: nextDept._id,
        title: 'Order Received',
        message: `Order #${order.orderNumber} moved from ${currentStage.name} to ${nextStage.name}`,
        type: 'STAGE_COMPLETED'
      });
    } else {
      // Final stage completed! Mark order completed
      order.status = 'Completed';
      order.completionTime = new Date();

      // Audit Log
      await ActivityLog.create({
        companyId: req.companyId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        action: 'ORDER_COMPLETED',
        userId: req.user._id,
        userName: req.user.name,
        departmentId: order.currentDepartmentId,
        departmentName: currentStage.name,
        details: `Final stage '${currentStage.name}' completed. Order #${order.orderNumber} is COMPLETED!`
      });

      // Notification to Owner
      await Notification.create({
        companyId: req.companyId,
        recipientRole: 'owner',
        title: 'Order Completed 🎉',
        message: `Order #${order.orderNumber} (${order.productName}) has finished all production stages!`,
        type: 'ORDER_COMPLETED'
      });
    }

    await order.save();

    const updatedPopulated = await Order.findById(order._id)
      .populate('currentStageId', 'name orderIndex')
      .populate('currentDepartmentId', 'name');

    res.json(updatedPopulated);
  } catch (error) {
    next(error);
  }
};

// @desc Update Order details
// @route PUT /api/orders/:id
// @access Private (Owner only)
const updateOrder = async (req, res, next) => {
  try {
    const { customerName, productName, quantity, priority, remarks, dueDate } = req.body;
    const order = await Order.findOne({ _id: req.params.id, companyId: req.companyId });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (customerName) order.customerName = customerName;
    if (productName) order.productName = productName;
    if (quantity) order.quantity = quantity;
    if (priority) order.priority = priority;
    if (remarks !== undefined) order.remarks = remarks;
    if (dueDate) order.dueDate = dueDate;

    order.status = checkDelayedStatus(order);
    await order.save();

    await ActivityLog.create({
      companyId: req.companyId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      action: 'ORDER_EDITED',
      userId: req.user._id,
      userName: req.user.name,
      details: `Updated details for order #${order.orderNumber}`
    });

    res.json(order);
  } catch (error) {
    next(error);
  }
};

// @desc Delete Order
// @route DELETE /api/orders/:id
// @access Private (Owner only)
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await ActivityLog.create({
      companyId: req.companyId,
      orderId: order._id,
      orderNumber: order.orderNumber,
      action: 'ORDER_DELETED',
      userId: req.user._id,
      userName: req.user.name,
      details: `Deleted order #${order.orderNumber}`
    });

    await order.deleteOne();
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  completeStage,
  updateOrder,
  deleteOrder
};
