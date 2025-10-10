#!/bin/bash

FILE="src/App.tsx"

if [ ! -f "$FILE" ]; then
  echo "File $FILE non trovato!"
  exit 1
fi

# Backup del file originale
cp "$FILE" "${FILE}.bak"
echo "Backup creato: ${FILE}.bak"

# 1️⃣ Sostituzione NodeJS.Timeout -> ReturnType<typeof setTimeout>
sed -i 's/NodeJS\.Timeout/ReturnType<typeof setTimeout>/g' "$FILE"
echo "Sostituiti tutti i NodeJS.Timeout"

# 2️⃣ Sistemare import React
# Rimuove "React," dall'import principale se presente
sed -i 's/import React, \({[^}]*}\) from.*/import \1 from "react";/g' "$FILE"
echo "Import React sistemato"

# 3️⃣ Aggiungere import easing Framer Motion (solo se non presente)
grep -q 'easeInOut' "$FILE"
if [ $? -ne 0 ]; then
  sed -i '1i import { easeInOut, easeIn, easeOut } from "framer-motion";' "$FILE"
  echo "Import easing Framer Motion aggiunto"
fi

# 4️⃣ Sostituire le animazioni variants con easing compatibili
# FadeUp
sed -i '/const fadeUp = {/,/};/c\
const fadeUp = {\n  hidden: { opacity: 0, y: 20 },\n  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: easeInOut } }\n};' "$FILE"

# ScaleIn
sed -i '/const scaleIn = {/,/};/c\
const scaleIn = {\n  hidden: { opacity: 0, scale: 0.95 },\n  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeInOut } }\n};' "$FILE"

# PillVariant
sed -i '/const pillVariant = {/,/};/c\
const pillVariant = {\n  hidden: { opacity: 0, y: 10 },\n  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeInOut } }\n};' "$FILE"

echo "Animazioni variants sistemate"

echo "✅ Tutti i fix applicati a $FILE. Backup originale: ${FILE}.bak"
