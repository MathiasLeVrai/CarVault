# Lessons

## Vérifier qu'un composant est réellement utilisé avant de le traiter comme une feature active
- **Contexte** : audit config Capacitor iOS. J'ai trouvé `PlateScanModal.jsx` (scan de plaque via caméra + tesseract.js) et j'en ai déduit que la feature existait → j'ai ajouté la permission `NSCameraUsageDescription`. En réalité la feature avait été retirée ; le composant était du code mort, importé nulle part.
- **Règle** : quand un `grep` remonte un composant/feature, vérifier qu'il est **importé et atteignable** (`grep -rn "import.*<Composant>"`) avant de conclure qu'il est vivant. La présence d'un fichier ≠ feature active.
- **Corollaire** : du code mort entraîne des permissions natives inutiles (motif de rejet Apple : déclarer une API non utilisée) et de la pub mensongère (la FAQ landing vantait encore le scan de plaque).
