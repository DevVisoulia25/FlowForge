const Stage = require('../models/Stage');
const Department = require('../models/Department');

// @desc Get all stages
// @route GET /api/stages
// @access Private
const getStages = async (req, res, next) => {
  try {
    const stages = await Stage.find({ companyId: req.companyId })
      .populate('departmentId', 'name orderIndex')
      .sort({ orderIndex: 1 });
    res.json(stages);
  } catch (error) {
    next(error);
  }
};

// @desc Create stage
// @route POST /api/stages
// @access Private (Owner only)
const createStage = async (req, res, next) => {
  try {
    const { name, departmentId } = req.body;
    if (!name || !departmentId) {
      return res.status(400).json({ message: 'Stage name and department are required' });
    }

    const count = await Stage.countDocuments({ companyId: req.companyId });
    const stage = await Stage.create({
      companyId: req.companyId,
      departmentId,
      name,
      orderIndex: count
    });

    const populatedStage = await Stage.findById(stage._id).populate('departmentId', 'name orderIndex');
    res.status(201).json(populatedStage);
  } catch (error) {
    next(error);
  }
};

// @desc Update stage
// @route PUT /api/stages/:id
// @access Private (Owner only)
const updateStage = async (req, res, next) => {
  try {
    const { name, departmentId } = req.body;
    const stage = await Stage.findOneAndUpdate(
      { _id: req.params.id, companyId: req.companyId },
      { name, departmentId },
      { new: true, runValidators: true }
    ).populate('departmentId', 'name orderIndex');

    if (!stage) {
      return res.status(404).json({ message: 'Stage not found' });
    }

    res.json(stage);
  } catch (error) {
    next(error);
  }
};

// @desc Delete stage
// @route DELETE /api/stages/:id
// @access Private (Owner only)
const deleteStage = async (req, res, next) => {
  try {
    const stage = await Stage.findOne({ _id: req.params.id, companyId: req.companyId });
    if (!stage) {
      return res.status(404).json({ message: 'Stage not found' });
    }

    await stage.deleteOne();

    // Re-index remaining stages
    const remainingStages = await Stage.find({ companyId: req.companyId }).sort({ orderIndex: 1 });
    for (let i = 0; i < remainingStages.length; i++) {
      remainingStages[i].orderIndex = i;
      await remainingStages[i].save();
    }

    res.json({ message: 'Stage deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc Reorder stages
// @route PUT /api/stages/reorder
// @access Private (Owner only)
const reorderStages = async (req, res, next) => {
  try {
    const { stageIds } = req.body; // Array of IDs in new order
    if (!Array.isArray(stageIds)) {
      return res.status(400).json({ message: 'stageIds must be an array' });
    }

    for (let index = 0; index < stageIds.length; index++) {
      await Stage.updateOne(
        { _id: stageIds[index], companyId: req.companyId },
        { orderIndex: index }
      );
    }

    res.json({ message: 'Stages reordered successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages
};
