#!/usr/bin/env bash
# Génère les PDF du MCD, MLD et MPD CarVault à partir des fichiers PlantUML.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
JAR="$SCRIPT_DIR/.plantuml.jar"
PLANTUML_VERSION="1.2024.8"
PLANTUML_URL="https://github.com/plantuml/plantuml/releases/download/v${PLANTUML_VERSION}/plantuml-${PLANTUML_VERSION}.jar"

if ! command -v java >/dev/null 2>&1; then
  echo "Erreur : Java est requis pour générer les diagrammes."
  echo "Installez Java (JDK 11+) puis relancez ce script."
  exit 1
fi

if [[ ! -f "$JAR" ]]; then
  echo "Téléchargement de PlantUML ${PLANTUML_VERSION}..."
  curl -fsSL -o "$JAR" "$PLANTUML_URL"
fi

echo "Génération des diagrammes PNG..."
java -jar "$JAR" -tpng -o "$SCRIPT_DIR" \
  "$SCRIPT_DIR/mcd-carvault.puml" \
  "$SCRIPT_DIR/mld-carvault.puml" \
  "$SCRIPT_DIR/mpd-carvault.puml"

echo "Conversion PNG → PDF..."
(cd "$REPO_ROOT/backend" && node - "$SCRIPT_DIR" <<'NODE'
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];

for (const name of ['mcd-carvault', 'mld-carvault', 'mpd-carvault']) {
  const png = path.join(dir, `${name}.png`);
  const pdf = path.join(dir, `${name}.pdf`);
  if (!fs.existsSync(png)) {
    console.error(`Fichier manquant : ${png}`);
    process.exit(1);
  }
  const doc = new PDFDocument({ autoFirstPage: false });
  const stream = fs.createWriteStream(pdf);
  doc.pipe(stream);
  doc.addPage({ size: 'A3', layout: 'landscape', margin: 20 });
  doc.image(png, 20, 20, {
    fit: [doc.page.width - 40, doc.page.height - 40],
    align: 'center',
    valign: 'center',
  });
  doc.end();
  stream.on('finish', () => console.log(`  - ${pdf}`));
}
NODE
)

echo ""
echo "PDF générés avec succès."
