#!/bin/bash
# Run a local server so drag-and-drop and saving work reliably.
cd "$(dirname "$0")"
PORT="${1:-8080}"
echo "DNA TRAVELS NYC → http://localhost:$PORT"
echo "Press Ctrl+C to stop."
python3 serve.py "$PORT"
