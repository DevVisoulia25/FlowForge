const Company = require('../models/Company');
const Department = require('../models/Department');
const Stage = require('../models/Stage');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc Complete First Time Setup Wizard
// @route POST /api/company/setup
// @access Private (Owner only)
const completeSetup = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { companyInfo, departments, stages, departmentLogins } = req.body;

    // 1. Update Company Information
    if (companyInfo) {
      await Company.findByIdAndUpdate(companyId, {
        name: companyInfo.name,
        logo: companyInfo.logo || '',
        industry: companyInfo.industry || 'General',
        address: companyInfo.address || '',
        phone: companyInfo.phone || '',
        email: companyInfo.email || '',
        workingHours: companyInfo.workingHours || '08:00 - 17:00'
      });
    }

    // Clear previous setup data if re-running
    await Department.deleteMany({ companyId });
    await Stage.deleteMany({ companyId });
    await User.deleteMany({ companyId, role: 'department' });

    // 2. Create Departments
    const deptMap = {}; // temp name -> Department Object
    for (let i = 0; i < departments.length; i++) {
      const deptData = departments[i];
      const dept = await Department.create({
        companyId,
        name: deptData.name,
        orderIndex: i
      });
      deptMap[deptData.name] = dept;
    }

    // 3. Create Production Stages
    for (let i = 0; i < stages.length; i++) {
      const stageData = stages[i];
      const linkedDept = deptMap[stageData.departmentName];
      if (linkedDept) {
        await Stage.create({
          companyId,
          departmentId: linkedDept._id,
          name: stageData.name,
          orderIndex: i
        });
      }
    }

    // 4. Create Department Logins
    for (const loginData of departmentLogins) {
      const linkedDept = deptMap[loginData.departmentName];
      if (linkedDept && loginData.username && loginData.password) {
        await User.create({
          companyId,
          name: `${loginData.departmentName} Dept`,
          username: loginData.username.toLowerCase().trim(),
          password: loginData.password,
          role: 'department',
          departmentId: linkedDept._id
        });
      }
    }

    // Mark company setup complete
    const company = await Company.findByIdAndUpdate(
      companyId,
      { isSetupComplete: true },
      { new: true }
    );

    // Create Notification
    await Notification.create({
      companyId,
      recipientRole: 'owner',
      title: 'Setup Completed',
      message: 'Company workflow setup has been successfully completed!',
      type: 'SETUP_COMPLETED'
    });

    res.json({ message: 'Setup completed successfully', company });
  } catch (error) {
    next(error);
  }
};

// @desc Get Company Profile
// @route GET /api/company/profile
// @access Private (Owner only)
const getProfile = async (req, res, next) => {
  try {
    const company = await Company.findById(req.companyId);
    res.json(company);
  } catch (error) {
    next(error);
  }
};

// @desc Update Company Profile
// @route PUT /api/company/profile
// @access Private (Owner only)
const updateProfile = async (req, res, next) => {
  try {
    const company = await Company.findByIdAndUpdate(req.companyId, req.body, {
      new: true,
      runValidators: true
    });
    res.json(company);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  completeSetup,
  getProfile,
  updateProfile
};
