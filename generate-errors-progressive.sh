#!/bin/bash
# Generate 5000 error events spread over time to simulate monthly usage

set -e

# Configuration
TOTAL_ERRORS=${1:-5000}
BATCH_SIZE=${2:-100}
DELAY_MS=${3:-50}

echo "🚀 Generating ${TOTAL_ERRORS} error events for ErrorWatch testing..."
echo "======================================================================"
echo "Batch size: ${BATCH_SIZE} errors per batch"
echo "Delay between batches: ${DELAY_MS}ms"
echo "Total duration: ~$(echo "scale=1; $TOTAL_ERRORS * $DELAY_MS / 1000 / 60" | bc) minutes"
echo ""

# Change to example-client directory
cd "$(dirname "$0")/example-client"

# Check if we're in the right directory
if [ ! -f "bin/console" ]; then
  echo "❌ Error: bin/console not found. Are you in the example-client directory?"
  exit 1
fi

# Calculate number of batches
BATCHES=$(( (TOTAL_ERRORS + BATCH_SIZE - 1) / BATCH_SIZE ))
REMAINING=$TOTAL_ERRORS

echo "📊 Generating ${TOTAL_ERRORS} errors in ${BATCHES} batches..."
echo ""

# Generate errors in batches
for batch in $(seq 1 $BATCHES); do
  # Calculate current batch size
  if [ $REMAINING -lt $BATCH_SIZE ]; then
    CURRENT_BATCH=$REMAINING
  else
    CURRENT_BATCH=$BATCH_SIZE
  fi

  echo "📦 Batch ${batch}/${BATCHES}: Generating ${CURRENT_BATCH} errors..."
  
  # Run the Symfony command
  php bin/console app:generate-errors ${CURRENT_BATCH} --burst > /dev/null 2>&1

  # Update remaining
  REMAINING=$((REMAINING - CURRENT_BATCH))

  # Show progress
  GENERATED=$((TOTAL_ERRORS - REMAINING))
  PERCENT=$((GENERATED * 100 / TOTAL_ERRORS))
  echo "   Progress: ${GENERATED}/${TOTAL_ERRORS} (${PERCENT}%)"

  # Delay between batches (except for the last one)
  if [ $REMAINING -gt 0 ]; then
    sleep $(echo "scale=3; ${DELAY_MS} / 1000" | bc)
  fi
done

echo ""
echo "✅ Done! ${TOTAL_ERRORS} error events have been sent to ErrorWatch."
echo ""
echo "🔍 Check your ErrorWatch dashboard: http://localhost:3001/dashboard"
echo ""
