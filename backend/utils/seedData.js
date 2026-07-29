const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Company = require('../models/Company');
const User = require('../models/User');
const Department = require('../models/Department');
const Stage = require('../models/Stage');
const Order = require('../models/Order');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

dotenv.config({ path: '../.env' });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/flowforge');
    console.log('Connected to MongoDB for seeding...');

    // Clear existing collections
    await Company.deleteMany({});
    await User.deleteMany({});
    await Department.deleteMany({});
    await Stage.deleteMany({});
    await Order.deleteMany({});
    await ActivityLog.deleteMany({});
    await Notification.deleteMany({});

    // 1. Create Demo Company
    const company = await Company.create({
      name: 'Apex Manufacturing Solutions',
      industry: 'Electronics & PCB',
      address: '742 Evergreen Terrace, Industrial Zone',
      phone: '+1 (555) 019-2834',
      email: 'contact@apexmanufacturing.com',
      workingHours: '08:00 - 18:00 (Mon - Sat)',
      isSetupComplete: true
    });

    // 2. Create Owner User
    const owner = await User.create({
      companyId: company._id,
      name: 'Sarah Connor (Owner)',
      username: 'owner',
      password: 'password123',
      role: 'owner'
    });

    // 3. Create Departments
    const deptCutting = await Department.create({ companyId: company._id, name: 'Cutting & Drilling', orderIndex: 0 });
    const deptAssembly = await Department.create({ companyId: company._id, name: 'Assembly & Soldering', orderIndex: 1 });
    const deptQuality = await Department.create({ companyId: company._id, name: 'Quality Control', orderIndex: 2 });
    const deptDispatch = await Department.create({ companyId: company._id, name: 'Packaging & Dispatch', orderIndex: 3 });

    // 4. Create Department Logins
    const userCutting = await User.create({
      companyId: company._id,
      name: 'Cutting Workstation',
      username: 'dept_cutting',
      password: 'password123',
      role: 'department',
      departmentId: deptCutting._id
    });

    const userAssembly = await User.create({
      companyId: company._id,
      name: 'Assembly Workstation',
      username: 'dept_assembly',
      password: 'password123',
      role: 'department',
      departmentId: deptAssembly._id
    });

    const userQuality = await User.create({
      companyId: company._id,
      name: 'Quality Workstation',
      username: 'dept_quality',
      password: 'password123',
      role: 'department',
      departmentId: deptQuality._id
    });

    const userDispatch = await User.create({
      companyId: company._id,
      name: 'Dispatch Workstation',
      username: 'dept_dispatch',
      password: 'password123',
      role: 'department',
      departmentId: deptDispatch._id
    });

    // 5. Create Production Stages
    const stage1 = await Stage.create({ companyId: company._id, departmentId: deptCutting._id, name: 'CNC Board Cutting', orderIndex: 0 });
    const stage2 = await Stage.create({ companyId: company._id, departmentId: deptAssembly._id, name: 'SMT Component Soldering', orderIndex: 1 });
    const stage3 = await Stage.create({ companyId: company._id, departmentId: deptQuality._id, name: 'Automated Optical Inspection (AOI)', orderIndex: 2 });
    const stage4 = await Stage.create({ companyId: company._id, departmentId: deptDispatch._id, name: 'Final Boxing & Dispatch', orderIndex: 3 });

    // 6. Create Initial Demo Orders
    const order1 = await Order.create({
      companyId: company._id,
      orderNumber: 'ORD-2026-001',
      customerName: 'Tesla Energy Corp',
      productName: 'Power Inverter Mainboard v4',
      quantity: 500,
      priority: 'High',
      remarks: 'Urgent shipment. Vacuum seal ESD packaging required.',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      currentStageId: stage1._id,
      currentDepartmentId: deptCutting._id,
      status: 'In Progress',
      stageHistory: [
        {
          stageId: stage1._id,
          stageName: stage1.name,
          departmentId: deptCutting._id,
          departmentName: deptCutting.name,
          enteredAt: new Date(),
          remarks: 'Material cut verified'
        }
      ]
    });

    const order2 = await Order.create({
      companyId: company._id,
      orderNumber: 'ORD-2026-002',
      customerName: 'RoboTech Dynamics',
      productName: 'Servo Motor Control Module',
      quantity: 250,
      priority: 'Medium',
      remarks: 'Batch test thermal resistance.',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      currentStageId: stage2._id,
      currentDepartmentId: deptAssembly._id,
      status: 'In Progress',
      stageHistory: [
        {
          stageId: stage1._id,
          stageName: stage1.name,
          departmentId: deptCutting._id,
          departmentName: deptCutting.name,
          enteredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          completedBy: userCutting._id,
          completedByName: userCutting.name,
          remarks: 'Panels drilled cleanly'
        },
        {
          stageId: stage2._id,
          stageName: stage2.name,
          departmentId: deptAssembly._id,
          departmentName: deptAssembly.name,
          enteredAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          remarks: ''
        }
      ]
    });

    const order3 = await Order.create({
      companyId: company._id,
      orderNumber: 'ORD-2026-003',
      customerName: 'Global Medical Systems',
      productName: 'Patient Monitor Display Driver',
      quantity: 100,
      priority: 'High',
      remarks: 'Medical grade compliance certificates required.',
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Delayed!
      currentStageId: stage3._id,
      currentDepartmentId: deptQuality._id,
      status: 'Delayed',
      stageHistory: [
        {
          stageId: stage1._id,
          stageName: stage1.name,
          departmentId: deptCutting._id,
          departmentName: deptCutting.name,
          enteredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          completedBy: userCutting._id,
          completedByName: userCutting.name,
          remarks: ''
        },
        {
          stageId: stage2._id,
          stageName: stage2.name,
          departmentId: deptAssembly._id,
          departmentName: deptAssembly.name,
          enteredAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          completedBy: userAssembly._id,
          completedByName: userAssembly.name,
          remarks: ''
        },
        {
          stageId: stage3._id,
          stageName: stage3.name,
          departmentId: deptQuality._id,
          departmentName: deptQuality.name,
          enteredAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          remarks: 'Under inspection'
        }
      ]
    });

    // Seed Activity Log
    await ActivityLog.create({
      companyId: company._id,
      orderId: order1._id,
      orderNumber: order1.orderNumber,
      action: 'ORDER_CREATED',
      userId: owner._id,
      userName: owner.name,
      details: `Owner created order #${order1.orderNumber}`
    });

    console.log('Seed completed successfully!');
    console.log('-------------------------------------------');
    console.log('DEMO LOGINS:');
    console.log('Company Owner: username = "owner", password = "password123"');
    console.log('Cutting Dept: username = "dept_cutting", password = "password123"');
    console.log('Assembly Dept: username = "dept_assembly", password = "password123"');
    console.log('Quality Dept: username = "dept_quality", password = "password123"');
    console.log('Dispatch Dept: username = "dept_dispatch", password = "password123"');
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seed();
