import firestoreService from "../services/firestoreService.js";

export const getCollectionData = async (req, res) => {
  const { dbName, appName, collectionType } = req.params;
  console.log("[collectionController] route hit:", { dbName, appName, collectionType });

  if (!appName || !collectionType) {
    return res.status(400).json({ error: "appName and collectionType are required." });
  }

  // Try exact, then common fallbacks (lowercase app / lowercase type)
  const candidates = [
    `${appName}_${collectionType}`,                               // exact
    `${appName.toLowerCase()}_${collectionType}`,                 // lowercase app
    `${appName}_${collectionType.toLowerCase()}`,                 // lowercase type
    `${appName.toLowerCase()}_${collectionType.toLowerCase()}`,   // both lowercase
  ];

  try {
    for (const path of candidates) {
      console.log(`[collectionController] trying path: ${dbName}:${path}`);
      const data = await firestoreService.getCollectionFromFirestore(dbName, path);
      if (Array.isArray(data) && data.length > 0) {
        console.log(`[collectionController] matched path: ${path} (count=${data.length})`);
        return res.status(200).json(data);
      }
    }

    console.warn("[collectionController] no documents found for any candidate paths:", candidates);
    return res.status(200).json([]); // empty but not an error
  } catch (error) {
    console.error("[collectionController] ERROR:", error);
    return res.status(500).json({ error: "Failed to fetch collection data." });
  }
};
