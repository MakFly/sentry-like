#!/bin/bash
# Generate 5000 error events for testing ErrorWatch UI monthly usage

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "❌ Error: node is not installed or not in PATH"
    exit 1
fi

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo "🚀 Generating 5000 error events for ErrorWatch testing..."
echo "====================================================="

# Run the Node.js script
node "${SCRIPT_DIR}/generate-errors.js" 5000 "$@" "$MODE"
