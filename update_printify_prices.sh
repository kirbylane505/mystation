#!/bin/bash
# Printify Price Updater — Mike Page Empire
# Updates product variant prices via Printify API

TOKEN='eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6Ijg2OTQ0ZTdjZTEyNjk3ZjViNWEyYzg0NTkzZGFiY2FkNTMyOTNkNTAzYzM0ODUyODYwNjhlZTQ2Njc2ZTM5MDRhYzRkYzkzMDQ1ZTcyZGEzIiwiaWF0IjoxNzcxMDI1MjMwLjU5NDUyMiwibmJmIjoxNzcxMDI1MjMwLjU5NDUyNSwiZXhwIjoxODAyNTYxMjMwLjU4NTYyNiwic3ViIjoiMjYzMTczMDciLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.CcejniicRfZ3jWsTi2APtwfEuOqXIHgM3nrc8AJqrsKhhEa_vYoczxZqFEebgM0Lr6ScuiduBVAbTwtPDmQoLZAOj4KfMO5Bid8V08vJQ8ZlqDMCPH7BkSD23d1vZyXAAL9ugl7GCev__ZkhQ7ymWZX45wRsjkB876Iz4KdvBoUVCoHT18QAHzzSj6TyfSfJKydKgxxT2U0FmYdW7z_YTI0WwffMBFTApssujY-MOY-y1C6Cr47fxiMzhT67pSXG3DSCusR4bUq1U2l7WKmn3CgX70dxXG_ZdtmZ_Rqzlcpswv5Xovbt3mtLaLg8qQTz85nkWQdyTHxuZjInKlf0b6_hkUIUosXTYR7Ul0sg3X760LpdM3JsX2fv9ww_fxLhruL2ypJBVyCHM5-JQ5UF_NfUFNmWnT0NV6ys-5O6KtUxQwn__ys_Us2XD_knxhqPQR-IzwsSLiJcB_UgfWRXkYLTEKR3SfEfp5xXRw3gC29Q0-xjD6ShJy1vN-klRv1ZQkzUnkTl3iFwqwnHPdSM0Y2pGFLBCOVxrLNbGllVLQnl0Q7KwGEu5a6lOvpiMHMjst3TeE8V3s0S_ghecPe9s1w3aFwwZpT63YeTVLouReIVnUXEBSjyrjzq1dXF1ioHmW51j3MtvpKp_9FZBVlYFg0zeS5OEhvZ-XCAJN63nd0'
SHOP=26418542
BASE="https://api.printify.com/v1/shops/$SHOP/products"
UA="Mozilla/5.0 (compatible; MyStation/1.0)"

SUCCESS=0
FAIL=0

update_product() {
    local PRODUCT_ID="$1"
    local PRODUCT_NAME="$2"
    local TARGET_PRICE="$3"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "PRODUCT: $PRODUCT_NAME"
    echo "ID:      $PRODUCT_ID"
    echo "TARGET:  $TARGET_PRICE cents (\$$(echo "scale=2; $TARGET_PRICE/100" | bc))"
    echo ""

    # Step 1: GET the product
    RESPONSE=$(curl -s -w "\n%{http_code}" \
        "$BASE/$PRODUCT_ID.json" \
        -H "Authorization: Bearer $TOKEN" \
        -H "User-Agent: $UA")

    HTTP_CODE=$(echo "$RESPONSE" | tail -1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$HTTP_CODE" != "200" ]; then
        echo "  FAILED to GET product (HTTP $HTTP_CODE)"
        echo "  Response: $BODY"
        FAIL=$((FAIL + 1))
        return 1
    fi

    # Step 2: Extract variant IDs and build PUT body using python3
    PUT_BODY=$(echo "$BODY" | python3 -c "
import sys, json
data = json.load(sys.stdin)
variants = data.get('variants', [])
enabled_variants = []
for v in variants:
    entry = {'id': v['id'], 'price': $TARGET_PRICE}
    # Preserve is_enabled status
    if 'is_enabled' in v:
        entry['is_enabled'] = v['is_enabled']
    enabled_variants.append(entry)
print(json.dumps({'variants': enabled_variants}))
" 2>&1)

    if [ $? -ne 0 ]; then
        echo "  FAILED to parse variants"
        echo "  Error: $PUT_BODY"
        FAIL=$((FAIL + 1))
        return 1
    fi

    VARIANT_COUNT=$(echo "$PUT_BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)['variants']))")
    echo "  Found $VARIANT_COUNT variants"

    # Step 3: PUT the update
    PUT_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT \
        "$BASE/$PRODUCT_ID.json" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -H "User-Agent: $UA" \
        -d "$PUT_BODY")

    PUT_CODE=$(echo "$PUT_RESPONSE" | tail -1)
    PUT_RESULT=$(echo "$PUT_RESPONSE" | sed '$d')

    if [ "$PUT_CODE" = "200" ]; then
        # Verify the price was set
        VERIFY_PRICE=$(echo "$PUT_RESULT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
prices = set(v['price'] for v in data.get('variants', []))
print(','.join(str(p) for p in prices))
" 2>/dev/null)
        echo "  SUCCESS (HTTP $PUT_CODE) — $VARIANT_COUNT variants updated"
        echo "  Verified prices: $VERIFY_PRICE cents"
        SUCCESS=$((SUCCESS + 1))
    else
        echo "  FAILED to PUT (HTTP $PUT_CODE)"
        echo "  Response: $(echo "$PUT_RESULT" | head -c 300)"
        FAIL=$((FAIL + 1))
        return 1
    fi
    echo ""
}

echo ""
echo "=========================================="
echo "  PRINTIFY PRICE UPDATER"
echo "  Mike Page Empire"
echo "=========================================="
echo ""

# ─── GROUP 1: TANK TOPS / CROP TOPS → $24.99 (2499 cents) ───
echo "GROUP 1: TANK TOPS / CROP TOPS → \$24.99"
echo "=========================================="
update_product "6988fb8f178eb4a8810ba679" "Mike Page Foundation Tank Top" 2499
update_product "6988fb8b4c4363802b0dd2a3" "LOTL Festival Tank Top" 2499
update_product "6988fb894c4363802b0dd2a1" "IDMG Jersey Tank Top" 2499
update_product "6988fb1349f8687bb30f5fcb" "IDMG Festival Crop Top" 2499
update_product "6988fc0e20f2d6496d0373dc" "LOTL Festival Crop Top" 2499

echo ""
echo "=========================================="

# ─── GROUP 2: CAPS / HEADWEAR → $24.99 (2499 cents) ───
echo "GROUP 2: ALL CAPS / HEADWEAR → \$24.99"
echo "=========================================="
update_product "698c046ebeff95f1d70bd78f" "Copy of LOTL Festival Snapback Cap" 2499
update_product "698a1b11659b6c9976039af2" "Mid Profile Baseball Cap" 2499
update_product "69892f2696c78124040164fc" "LOTL Festival Snapback Cap" 2499
update_product "69892f2137dd4b764b0421ed" "IDMG Snapback Cap" 2499
update_product "6988fc1932f975db9606e01c" "IDMG Bucket Hat" 2499
update_product "6988fc1549f8687bb30f5fcd" "LOTL Festival Bucket Hat" 2499
update_product "698d5218e99bad0b550c6023" "LOTL Festival Skully" 2499
update_product "698d4e8f12e16c9925035623" "IDMG Skully" 2499

echo ""
echo "=========================================="
echo "  SUMMARY"
echo "=========================================="
echo "  SUCCESS: $SUCCESS"
echo "  FAILED:  $FAIL"
echo "  TOTAL:   $((SUCCESS + FAIL))"
echo "=========================================="
