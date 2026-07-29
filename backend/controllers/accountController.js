const User = require('../models/User');
const Department = require('../models/Department');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// @desc Update Owner Profile & Password
// @route PUT /api/account/owner
// @access Private (Owner only)
const updateOwnerAccount = async (req, res, next) => {
  try {
    const { name, username, currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Username uniqueness validation across the whole system
    if (username && username.toLowerCase().trim() !== user.username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase().trim(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists.' });
      }
      user.username = username.toLowerCase().trim();
    }

    if (name) {
      user.name = name;
    }

    // Password change validation
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password is required to change password' });
      }

      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      if (!newPassword || newPassword.length < 4) {
        return res.status(400).json({ message: 'New password must be at least 4 characters' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'New password and Confirm password do not match' });
      }

      user.password = newPassword;
    }

    await user.save();

    // Log Activity
    await ActivityLog.create({
      companyId: req.companyId,
      action: 'OWNER_ACCOUNT_UPDATED',
      userId: user._id,
      userName: user.name,
      details: `Owner account updated profile / security settings`
    });

    res.json({
      message: 'Owner account updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already exists.' });
    }
    next(error);
  }
};

// @desc Get all department accounts
// @route GET /api/account/departments
// @access Private (Owner only)
const getDepartmentAccounts = async (req, res, next) => {
  try {
    const deptUsers = await User.find({ companyId: req.companyId, role: 'department' })
      .select('-password')
      .populate('departmentId', 'name orderIndex');
    res.json(deptUsers);
  } catch (error) {
    next(error);
  }
};

// @desc Update department account (Username, Reset Password, Rename Department)
// @route PUT /api/account/department/:id
// @access Private (Owner only)
const updateDepartmentAccount = async (req, res, next) => {
  try {
    const { username, newPassword, departmentName } = req.body;
    const deptUser = await User.findOne({ _id: req.params.id, companyId: req.companyId, role: 'department' });

    if (!deptUser) {
      return res.status(404).json({ message: 'Department account not found' });
    }

    // Check unique username across system
    if (username && username.toLowerCase().trim() !== deptUser.username) {
      const existingUser = await User.findOne({
        username: username.toLowerCase().trim(),
        _id: { $ne: deptUser._id }
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists.' });
      }
      deptUser.username = username.toLowerCase().trim();
    }

    // Password reset by owner (No need to know previous password)
    if (newPassword) {
      if (newPassword.length < 4) {
        return res.status(400).json({ message: 'Password must be at least 4 characters' });
      }
      deptUser.password = newPassword;
    }

    // Rename department if provided
    if (departmentName && deptUser.departmentId) {
      await Department.findByIdAndUpdate(deptUser.departmentId, { name: departmentName });
      deptUser.name = `${departmentName} Dept`;
    }

    await deptUser.save();

    // Log activity
    await ActivityLog.create({
      companyId: req.companyId,
      action: 'RESET_DEPT_PASSWORD',
      userId: req.user._id,
      userName: req.user.name,
      departmentId: deptUser.departmentId,
      details: `Owner updated credentials / reset password for department account '${deptUser.username}'`
    });

    // Notify Department
    await Notification.create({
      companyId: req.companyId,
      recipientRole: 'department',
      recipientDepartmentId: deptUser.departmentId,
      title: 'Account Updated',
      message: `Your department account credentials were updated by the company owner`,
      type: 'DEPT_ACCOUNT_UPDATED'
    });

    const updatedUser = await User.findById(deptUser._id).select('-password').populate('departmentId');
    res.json(updatedUser);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Username already exists.' });
    }
    next(error);
  }
};

module.exports = {
  updateOwnerAccount,
  getDepartmentAccounts,
  updateDepartmentAccount
};
