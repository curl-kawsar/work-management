import ActivityLog from '@/models/ActivityLog';
import connectDB from '@/lib/mongodb';

export const logActivity = async ({
  userId,
  action,
  entityType,
  entityId,
  description,
  oldValues = null,
  newValues = null,
  ipAddress = null,
  userAgent = null,
}) => {
  try {
    await connectDB();
    
    const activityLog = new ActivityLog({
      user: userId,
      action,
      entityType,
      entityId,
      description,
      oldValues,
      newValues,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    await activityLog.save();
    console.log('Activity logged:', description);
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to prevent breaking main functionality
  }
};

export const getActivityLogs = async (filters = {}) => {
  try {
    await connectDB();
    
    let query = {};
    
    if (filters.userId) {
      query.user = filters.userId;
    }
    
    if (filters.entityType) {
      query.entityType = filters.entityType;
    }
    
    if (filters.entityId) {
      query.entityId = filters.entityId;
    }
    
    if (filters.action) {
      query.action = filters.action;
    }
    
    if (filters.startDate && filters.endDate) {
      query.timestamp = {
        $gte: new Date(filters.startDate),
        $lte: new Date(filters.endDate),
      };
    }

    const logs = await ActivityLog.find(query)
      .populate('user', 'name email')
      .sort({ timestamp: -1 })
      .limit(filters.limit || 100);

    return logs;
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return [];
  }
};

export const getEntityActivityLogs = async (entityType, entityId) => {
  try {
    await connectDB();
    
    const logs = await ActivityLog.find({
      entityType,
      entityId,
    })
      .populate('user', 'name email')
      .sort({ timestamp: -1 });

    return logs;
  } catch (error) {
    console.error('Error fetching entity activity logs:', error);
    return [];
  }
};