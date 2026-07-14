const tagRepository = require("../repositories/tagRepository");
const activityLogRepository = require("../repositories/activityLogRepository");

class TagService {
  async getTags(query = {}) {
    const includeDeleted = query.includeDeleted === "true";
    return tagRepository.find({}, includeDeleted);
  }

  async getTagById(id) {
    return tagRepository.findById(id);
  }

  async createTag(data, userId) {
    data.createdBy = userId;
    data.updatedBy = userId;
    const tag = await tagRepository.create(data);

    await activityLogRepository.create({
      action: "tag_create",
      description: `Created tag "${tag.name}"`,
      userId,
    });
    return tag;
  }

  async updateTag(id, data, userId) {
    data.updatedBy = userId;
    const tag = await tagRepository.update(id, data);
    if (!tag) throw new Error("Tag not found.");

    await activityLogRepository.create({
      action: "tag_update",
      description: `Updated tag "${tag.name}"`,
      userId,
    });
    return tag;
  }

  async softDeleteTag(id, userId) {
    const tag = await tagRepository.softDelete(id, userId);
    if (!tag) throw new Error("Tag not found.");

    await activityLogRepository.create({
      action: "tag_delete",
      description: `Soft deleted tag "${tag.name}"`,
      userId,
    });
    return tag;
  }

  async restoreTag(id, userId) {
    const tag = await tagRepository.restore(id, userId);
    if (!tag) throw new Error("Tag not found.");

    await activityLogRepository.create({
      action: "tag_restore",
      description: `Restored tag "${tag.name}"`,
      userId,
    });
    return tag;
  }
}

module.exports = new TagService();
