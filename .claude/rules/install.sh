#!/usr/bin/env bash
set -euo pipefail

# Install Claude Code rules into ~/.claude/rules/
# Usage:
#   ./install.sh <language> [language...]
#   ./install.sh typescript
#   ./install.sh typescript python golang

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_DIR="${HOME}/.claude/rules"

AVAILABLE_LANGS=(typescript python golang swift php cpp kotlin perl)

usage() {
  echo "Usage: $(basename "$0") <language> [language...]"
  echo ""
  echo "Installs common rules plus one or more language-specific rule sets"
  echo "into ~/.claude/rules/"
  echo ""
  echo "Available languages:"
  for lang in "${AVAILABLE_LANGS[@]}"; do
    echo "  - ${lang}"
  done
  echo ""
  echo "Examples:"
  echo "  $(basename "$0") typescript"
  echo "  $(basename "$0") typescript python"
  exit 1
}

if [[ $# -eq 0 ]]; then
  usage
fi

# Validate all requested languages before installing anything
for lang in "$@"; do
  found=false
  for available in "${AVAILABLE_LANGS[@]}"; do
    if [[ "${lang}" == "${available}" ]]; then
      found=true
      break
    fi
  done
  if [[ "${found}" == "false" ]]; then
    echo "Error: unknown language '${lang}'"
    echo "Available: ${AVAILABLE_LANGS[*]}"
    exit 1
  fi
  if [[ ! -d "${SCRIPT_DIR}/${lang}" ]]; then
    echo "Error: rules directory not found for '${lang}' at ${SCRIPT_DIR}/${lang}"
    exit 1
  fi
done

# Create target directory
mkdir -p "${TARGET_DIR}"

# Always install common rules first
echo "Installing common rules..."
rm -rf "${TARGET_DIR}/common"
cp -r "${SCRIPT_DIR}/common" "${TARGET_DIR}/common"
echo "  ✓ common → ${TARGET_DIR}/common"

# Install each requested language
for lang in "$@"; do
  echo "Installing ${lang} rules..."
  rm -rf "${TARGET_DIR}/${lang}"
  cp -r "${SCRIPT_DIR}/${lang}" "${TARGET_DIR}/${lang}"
  echo "  ✓ ${lang} → ${TARGET_DIR}/${lang}"
done

echo ""
echo "Done! Installed rules for: common $*"
echo "Rules directory: ${TARGET_DIR}"
