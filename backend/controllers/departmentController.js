const Department = require('../models/Department');
const User = require('../models/User');
const Stage = require('../models/Stage');

// @desc Get all departments
// @route GET /api/departments
// @access Private
const getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ companyId: req.companyId }).sort({ orderIndex: 1 });
    res.json(departments);
  } catch (error) {
    next(error);
  }
};

// @desc Create department
// @route POST /api/departments
// @access Private (Owner only)
const createDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const count = await Department.countDocuments({ companyId: req.companyId });
    const department = await Department.create({
      companyId: req.companyId,
      name,
      orderIndex: count
    });

    res.status(201).json(department);
  } catch (error) {
    next(error);
  }
};

// @desc Update department
// @route PUT /api/departments/:id
// @access Private (Owner only)
const updateDepartment = async (req, res, next) => {
  try {
    const { name } = req.body;
    const department = await Department.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { name },
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    next(error);
  }
};

// @desc Delete department
// @route DELETE /api/departments/:id
// @access Private (Owner only)
const deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if stages depend on this department
    const dependentStages = await Stage.countDocuments({ departmentId: department._id });
    if (dependentStages > 0) {
      return res.status(400).json({
        message: `Cannot delete department '${department.name}'. It has ${dependentStages} stage(s) assigned to it. Delete or reassign those stages first.`
      });
    }

    // Remove department logins
    await User.deleteMany({ departmentId: department._id });
    await department.deleteOne();

    res.json({ message: 'Department removed successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Reorder departments
// @route PUT /api/departments/reorder
// @access Private (Owner only)
const reorderDepartments = async (req, res, next) => {
  try {
    const { departmentIds } = req.body; // Array of IDs in new order
    if (!Array.isArray(departmentIds)) {
      return res.status(400).json({ message: 'departmentIds must be an array' });
    }

    for (let index = 0; index < departmentIds.length; index++) {
      await Department.updateOne(
        { _id: departmentIds[index], companyId: req.companyId },
        { orderIndex: index }
      );
    }

    res.json({ message: 'Departments reordered successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  reorderDepartments
};
