function createInventory() {
  return {
    equipments: [],
    materials: []
  };
}

function addDropToInventory(inventory, drop) {
  if (drop.type === "equipment") {
    inventory.equipments.push(drop);
    return {
      ok: true,
      bucket: "equipments",
      item: drop
    };
  }

  inventory.materials.push(drop);

  return {
    ok: true,
    bucket: "materials",
    item: drop
  };
}

function countMaterial(inventory, materialId) {
  return inventory.materials.filter((item) => item.id === materialId).length;
}

function consumeMaterial(inventory, materialId, amount = 1) {
  let remaining = amount;

  inventory.materials = inventory.materials.filter((item) => {
    if (item.id === materialId && remaining > 0) {
      remaining--;
      return false;
    }
    return true;
  });

  return remaining === 0;
}

module.exports = {
  createInventory,
  addDropToInventory,
  countMaterial,
  consumeMaterial
};
