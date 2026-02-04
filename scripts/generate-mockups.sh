#!/bin/bash

# Printful Mockup Generator Script
# Generates product mockups with actual designs rendered on products

API_KEY="NWhjLwpO04XKjfyKPBCyKFmVqGup1mKRLAphbfS7"
BASE_URL="https://api.printful.com"

# Design URLs (publicly accessible)
IDMG_LOGO="https://mystation.vercel.app/images/idmg-logo-white.png"
LOTL_LOGO="https://mystation.vercel.app/images/lotl-logo-2026.png"
MPF_LOGO="https://mystation.vercel.app/images/mpf-logo.png"

# Output file for mockup URLs
OUTPUT_FILE="/Users/impossibledreamzmusicgroup/MikePageEmpire/apps/mystation/src/data/mockup-urls.json"

echo "{"

# Function to create mockup and get URL
create_mockup() {
    local product_id=$1
    local variant_id=$2
    local design_url=$3
    local product_name=$4
    local sync_product_id=$5

    echo "  Generating mockup for: $product_name" >&2

    # Determine placement and position based on product type
    local placement="front"
    local position=""

    # Hoodies (product_id 146) - Gildan 18500
    if [ "$product_id" = "146" ]; then
        position='{"area_width":1800,"area_height":2400,"width":1000,"height":1000,"top":500,"left":400}'
    # T-shirts (product_id 71) - Gildan 64000
    elif [ "$product_id" = "71" ]; then
        position='{"area_width":1800,"area_height":2400,"width":1000,"height":1000,"top":400,"left":400}'
    # Caps/Hats (product_id varies)
    else
        position='{"area_width":1000,"area_height":800,"width":500,"height":500,"top":150,"left":250}'
        placement="embroidery_front"
    fi

    # Create mockup task
    local task_response=$(curl -s -X POST \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        "$BASE_URL/mockup-generator/create-task/$product_id" \
        -d "{\"variant_ids\":[$variant_id],\"format\":\"jpg\",\"files\":[{\"placement\":\"$placement\",\"image_url\":\"$design_url\",\"position\":$position}]}")

    local task_key=$(echo "$task_response" | jq -r '.result.task_key // empty')

    if [ -z "$task_key" ]; then
        echo "    Failed to create task: $(echo "$task_response" | jq -r '.error.message // .result // "Unknown error"')" >&2
        echo "null"
        return
    fi

    echo "    Task created: $task_key" >&2

    # Poll for result (max 30 seconds)
    for i in {1..15}; do
        sleep 2
        local result=$(curl -s -H "Authorization: Bearer $API_KEY" "$BASE_URL/mockup-generator/task?task_key=$task_key")
        local status=$(echo "$result" | jq -r '.result.status')

        if [ "$status" = "completed" ]; then
            local mockup_url=$(echo "$result" | jq -r '.result.mockups[0].mockup_url // empty')
            if [ -n "$mockup_url" ]; then
                echo "    Success: $mockup_url" >&2
                echo "\"$mockup_url\""
                return
            fi
        elif [ "$status" = "failed" ]; then
            echo "    Task failed" >&2
            echo "null"
            return
        fi
        echo "    Waiting... ($i)" >&2
    done

    echo "    Timeout waiting for mockup" >&2
    echo "null"
}

# Get products and generate mockups
echo "Fetching products..." >&2

# IDMG Hoodie - Black (417490023)
echo "\"417490023\": $(create_mockup 146 5524 "$IDMG_LOGO" "IDMG Hoodie Black" 417490023),"

# IDMG Hoodie - White (417490024)
echo "\"417490024\": $(create_mockup 146 5526 "$IDMG_LOGO" "IDMG Hoodie White" 417490024),"

# LOTL Hoodie - Black (417490025)
echo "\"417490025\": $(create_mockup 146 5524 "$LOTL_LOGO" "LOTL Hoodie Black" 417490025),"

# IDMG Classic Tee - Black (417490018)
echo "\"417490018\": $(create_mockup 71 4012 "$IDMG_LOGO" "IDMG Tee Black" 417490018),"

# IDMG Classic Tee - White (417490021)
echo "\"417490021\": $(create_mockup 71 4013 "$IDMG_LOGO" "IDMG Tee White" 417490021),"

# LOTL Tee - Black (417490028)
echo "\"417490028\": $(create_mockup 71 4012 "$LOTL_LOGO" "LOTL Tee Black" 417490028),"

# LOTL Tee - Black (417490323) - duplicate
echo "\"417490323\": $(create_mockup 71 4012 "$LOTL_LOGO" "LOTL Tee Black 2" 417490323),"

# MPF Tee (417490030)
echo "\"417490030\": $(create_mockup 71 4012 "$MPF_LOGO" "MPF Tee" 417490030)"

echo "}"
