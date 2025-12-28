Understanding: Template API Standardization (Point-by-Point)
1. Current State
We have componentVocabulary.json (5 component types: text, form, card, button, image)
We have standardComponentSchemas.json (structure definitions with commonAttrs + specificAttrs)
We have sampleJSONformats.json (1 hanuma page with 1 form component example)
Gap: Only 1 complete component sample (form), missing text, card, button, image examples
2. What We Need: Complete Component Samples
Fetch/create full JSON examples for each component type from existing apps
Each sample must show: id, type, name, appName, createdAt, updatedAt, commonAttrs (all 13), specificAttrs (type-specific)
Store in sampleJSONformats.json under collections.components array with examples for: text, form, card, button, image
3. What We Need: Complete Page Samples
Fetch multiple page examples showing different layouts: single-column, two-column, three-column, hero-split
Each page must show: id, name, appName, layoutId, themeId, savedAt, components array (full embedded components)
Show pages with different component combinations (text+form, card grid, mixed layouts)
4. Standardization Goal
Define exact JSON structure that frontend expects for rendering/preview
All generated JSONs must match this structure precisely (field names, nesting, data types)
No optional/missing fields - every component must have all required properties
Consistent naming: lowercase types, proper timestamps, valid IDs
5. Template API Improvement
Update templateGenerationService.js to use real component samples as templates
Copy exact specificAttrs structure from samples (not generic defaults)
Generate realistic content but maintain exact structure from samples
Validate output matches sample structure before returning
6. Validation Flow
Input: appName, appType, content → Template Service
Service loads: component samples + page samples + schemas
Generation: Clone sample structures → inject content → preserve all fields
Validation: Compare output vs samples → ensure field-by-field match
Output: Perfect JSON ready for frontend preview without errors
7. Next Steps (In Order)
Fetch all component types from Firestore (text, card, button, image examples)
Add them to sampleJSONformats.json alongside existing form component
Fetch diverse page examples (different layouts/component combinations)
Update templateGenerationService.js to clone from these real samples
Test generation → verify frontend can preview without any issues
Key Insight: Template API should be a structure cloner with content injection, not a structure generator. Real samples = guaranteed frontend compatibility.