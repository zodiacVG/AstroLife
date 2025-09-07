#!/usr/bin/env bash
set -euo pipefail

# Detect python binary (prefer explicit env override)
PY_BIN="${PYTHON_BIN:-}"
if [[ -z "${PY_BIN}" ]]; then
  # Prefer pyenv 3.11 if present
  PYENV_ROOT_DIR="${PYENV_ROOT:-$HOME/.pyenv}"
  if [[ -x "$PYENV_ROOT_DIR/versions/3.11.9/bin/python3.11" ]]; then
    PY_BIN="$PYENV_ROOT_DIR/versions/3.11.9/bin/python3.11"
  elif command -v python3.11 >/dev/null 2>&1; then
    PY_BIN="python3.11"
  elif command -v python3.12 >/dev/null 2>&1; then
    PY_BIN="python3.12"
  elif command -v python3 >/dev/null 2>&1; then
    PY_BIN="python3"
  elif command -v python >/dev/null 2>&1; then
    PY_BIN="python"
  else
    echo "Error: No python interpreter found. Please install Python 3.11/3.12 or set PYTHON_BIN." >&2
    exit 1
  fi
fi

echo "[install-backend] Using Python: $(${PY_BIN} -V 2>&1)"

cd "$(dirname "$0")/.."  # repo root
cd backend

# Check existing venv python version
DESIRED_MM="$(${PY_BIN} -c 'import sys;print("%d.%d"%sys.version_info[:2])')"
if [[ -d "venv" && -x "venv/bin/python" ]]; then
  CURRENT_MM="$(venv/bin/python -c 'import sys;print("%d.%d"%sys.version_info[:2])')"
  if [[ "${CURRENT_MM}" != "${DESIRED_MM}" ]]; then
    echo "[install-backend] Recreating venv for Python ${DESIRED_MM} (was ${CURRENT_MM})"
    rm -rf venv
  fi
fi

# Create venv if missing (or removed)
if [[ ! -d "venv" ]]; then
  echo "[install-backend] Creating venv at backend/venv with ${PY_BIN}"
  ${PY_BIN} -m venv venv
fi

# Activate venv
# shellcheck disable=SC1091
source venv/bin/activate

echo "[install-backend] Upgrading pip/setuptools/wheel"
pip install --upgrade pip setuptools wheel

echo "[install-backend] Installing backend requirements"
pip install -r requirements.txt

echo "[install-backend] Done"
