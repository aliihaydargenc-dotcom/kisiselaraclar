const VALID_ROW_ID = /^[A-Za-z0-9][A-Za-z0-9._-]{0,35}$/;

function fnv(value, seed = 2166136261) {
  let result = seed >>> 0;
  const text = String(value ?? "");
  for (let index = 0; index < text.length; index += 1) {
    result ^= text.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

export function entityRowId(localId) {
  const id = String(localId || "");
  if (VALID_ROW_ID.test(id)) return id;
  const reverse = [...id].reverse().join("");
  return `e_${fnv(id)}_${fnv(reverse, 2246822519)}_${id.length.toString(36)}`;
}

export function entityTimestamp(type, item, now = Date.now()) {
  if (type === "tasks") {
    return Number(item?.updatedAt) || Number(item?.createdAt) || Number(now);
  }
  return Number(item?.updatedAt) || Number(now);
}

export function normalizeSyncEntity(type, item, now = Date.now()) {
  if (!item || typeof item !== "object") return null;
  const id = String(item.id || "").trim();
  if (!id) return null;
  const updatedAt = entityTimestamp(type, item, now);
  if (type === "tasks") {
    return {
      ...item,
      id,
      createdAt: Number(item.createdAt) || updatedAt,
      updatedAt
    };
  }
  return { ...item, id, updatedAt };
}

export function parseEntityRow(type, row) {
  const localId = String(row?.local_id || "");
  if (!localId || Number(row?.deleted_at || 0) > 0) return null;
  try {
    const payload = JSON.parse(String(row?.payload || "{}"));
    const entity = normalizeSyncEntity(type, { ...payload, id: localId }, Number(row?.updated_at || Date.now()));
    return entity ? { ...entity, updatedAt: Number(row?.updated_at) || entity.updatedAt } : null;
  } catch {
    return null;
  }
}

function liveWrite(type, item) {
  const entity = normalizeSyncEntity(type, item);
  return {
    rowId: entityRowId(entity.id),
    localId: entity.id,
    updatedAt: entityTimestamp(type, entity),
    deletedAt: 0,
    payload: JSON.stringify(entity)
  };
}

function deletedWrite(localId, deletedAt) {
  return {
    rowId: entityRowId(localId),
    localId,
    updatedAt: Number(deletedAt),
    deletedAt: Number(deletedAt),
    payload: "{}"
  };
}

function rowVersion(row) {
  return Math.max(Number(row?.updated_at || 0), Number(row?.deleted_at || 0));
}

function rowsEquivalent(row, write) {
  return String(row?.local_id || "") === write.localId &&
    Number(row?.updated_at || 0) === Number(write.updatedAt) &&
    Number(row?.deleted_at || 0) === Number(write.deletedAt) &&
    String(row?.payload || "") === write.payload;
}

export function mergeEntityCollection({
  type,
  localItems = [],
  cloudRows = [],
  baseline = {},
  now = Date.now()
} = {}) {
  const local = new Map();
  for (const source of Array.isArray(localItems) ? localItems : []) {
    const entity = normalizeSyncEntity(type, source, now);
    if (entity) local.set(entity.id, entity);
  }

  const cloud = new Map();
  for (const row of Array.isArray(cloudRows) ? cloudRows : []) {
    const id = String(row?.local_id || "");
    if (id) cloud.set(id, row);
  }

  const baselineMap = baseline && typeof baseline === "object" && !Array.isArray(baseline) ? baseline : {};
  const ids = new Set([...local.keys(), ...cloud.keys(), ...Object.keys(baselineMap)]);
  const items = [];
  const writes = [];

  for (const id of ids) {
    const localItem = local.get(id) || null;
    const cloudRow = cloud.get(id) || null;
    const wasLive = Object.prototype.hasOwnProperty.call(baselineMap, id);

    if (!localItem && wasLive) {
      const deletion = deletedWrite(id, now);
      if (!cloudRow || rowVersion(cloudRow) < deletion.deletedAt || Number(cloudRow.deleted_at || 0) === 0) {
        writes.push(deletion);
      }
      continue;
    }

    if (!localItem) {
      const cloudItem = parseEntityRow(type, cloudRow);
      if (cloudItem) items.push(cloudItem);
      continue;
    }

    const localVersion = entityTimestamp(type, localItem, now);
    if (!cloudRow) {
      const write = liveWrite(type, localItem);
      items.push(localItem);
      writes.push(write);
      continue;
    }

    const deletedAt = Number(cloudRow.deleted_at || 0);
    const cloudVersion = rowVersion(cloudRow);
    if (deletedAt > 0) {
      if (localVersion > deletedAt) {
        const write = liveWrite(type, localItem);
        items.push(localItem);
        writes.push(write);
      }
      continue;
    }

    const cloudItem = parseEntityRow(type, cloudRow);
    if (!cloudItem || localVersion >= cloudVersion) {
      const write = liveWrite(type, localItem);
      items.push(localItem);
      if (!rowsEquivalent(cloudRow, write)) writes.push(write);
    } else {
      items.push(cloudItem);
    }
  }

  const deduped = [...new Map(items.map((item) => [item.id, item])).values()];
  const nextBaseline = Object.fromEntries(deduped.map((item) => [item.id, entityTimestamp(type, item, now)]));
  return { items: deduped, writes, baseline: nextBaseline };
}
