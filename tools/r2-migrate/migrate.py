#!/opt/homebrew/bin/python3
"""R2 audio migration — audit, upload, rewrite, wipe-mw, cleanup."""
import json, os, re, shutil, sys, urllib.parse
from pathlib import Path
import boto3
from botocore.exceptions import ClientError

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
TRACKS_JS = REPO / "src/data/tracks.js"
MIDDLEWARE = REPO / "src/middleware.js"
ROBOTS = REPO / "public/robots.txt"
AUDIO_DIR = REPO / "public/audio"
STATE = HERE / ".state.json"
ENV_FILE = REPO / ".env.local"

R2_PUBLIC_BASE = "https://pub-0085ac11ad5f4ef9a6a563a5d1a026e9.r2.dev"

AUDIO_RE = re.compile(r"audioFile:\s*'([^']+)'")


def die(msg):
    print(f"ERROR: {msg}", file=sys.stderr)
    sys.exit(1)


def load_env():
    if not ENV_FILE.exists():
        die(f"missing {ENV_FILE}")
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k.strip(), v)
    for k in ("R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_PUBLIC_URL"):
        if not os.environ.get(k):
            die(f"missing env {k}")


def s3():
    return boto3.client(
        "s3",
        endpoint_url=f"https://{os.environ['R2_ACCOUNT_ID']}.r2.cloudflarestorage.com",
        aws_access_key_id=os.environ["R2_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["R2_SECRET_ACCESS_KEY"],
        region_name="auto",
    )


def slugify(filename):
    stem, ext = os.path.splitext(filename)
    s = stem.lower()
    s = re.sub(r"_mastered$", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = re.sub(r"-+", "-", s).strip("-")
    return f"{s}{ext.lower()}"


def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"rows": [], "audit_done": False}


def save_state(state):
    STATE.write_text(json.dumps(state, indent=2))


def audit():
    content = TRACKS_JS.read_text()
    rows = []
    for m in AUDIO_RE.finditer(content):
        raw = m.group(1)
        line_no = content[: m.start()].count("\n") + 1
        row = {"line": line_no, "raw": raw}
        if raw.startswith("http"):
            row["kind"] = "already-r2" if R2_PUBLIC_BASE in raw else "external"
        elif raw.startswith("/audio/"):
            decoded = urllib.parse.unquote(raw)
            parts = decoded.lstrip("/").split("/")
            if len(parts) == 3:
                _, album, filename = parts
            elif len(parts) == 2:
                album = "singles"
                filename = parts[1]
            else:
                row["kind"] = "unparseable"
                rows.append(row)
                continue
            local = REPO / "public" / decoded.lstrip("/")
            target_key = f"audio/{album}/{slugify(filename)}"
            row["album"] = album
            row["target_key"] = target_key
            row["target_url"] = f"{R2_PUBLIC_BASE}/{target_key}"
            if local.exists():
                row["kind"] = "local-exists"
                row["src"] = str(local)
                row["bytes"] = local.stat().st_size
                row["uploaded"] = False
            else:
                row["kind"] = "missing"
                row["expected_local"] = str(local)
        else:
            row["kind"] = "unknown"
        rows.append(row)

    state = load_state()
    prior_uploaded = {(r["raw"]): r for r in state.get("rows", []) if r.get("uploaded")}
    for r in rows:
        if r["raw"] in prior_uploaded:
            r["uploaded"] = True
            r["r2_etag"] = prior_uploaded[r["raw"]].get("r2_etag")
    state["rows"] = rows
    state["audit_done"] = True
    save_state(state)

    counts, bytes_by_kind = {}, {}
    for r in rows:
        counts[r["kind"]] = counts.get(r["kind"], 0) + 1
        if "bytes" in r:
            bytes_by_kind[r["kind"]] = bytes_by_kind.get(r["kind"], 0) + r["bytes"]

    print(f"=== audit -> {STATE} ===")
    for kind in sorted(counts):
        sz = bytes_by_kind.get(kind, 0)
        mb = f"  ({sz / 1024 / 1024:.0f} MB)" if sz else ""
        print(f"  {counts[kind]:>4}  {kind}{mb}")
    print(f"  {sum(counts.values()):>4}  total")

    by_album = {}
    for r in rows:
        if r["kind"] == "local-exists":
            by_album.setdefault(r["album"], []).append(r)
    if by_album:
        print(f"\n--- local-exists per album ---")
        for album, items in sorted(by_album.items()):
            sz = sum(i["bytes"] for i in items) / 1024 / 1024
            print(f"  {len(items):>3} files, {sz:>5.0f} MB  audio/{album}/")

    missing = [r for r in rows if r["kind"] == "missing"]
    if missing:
        print(f"\n--- missing files ({len(missing)}) ---")
        for r in missing:
            print(f"  line {r['line']:>4}: {r['raw']}")


def upload():
    state = load_state()
    if not state["audit_done"]:
        die("run `audit` first")
    client = s3()
    bucket = os.environ["R2_BUCKET_NAME"]
    pending = [r for r in state["rows"] if r["kind"] == "local-exists" and not r.get("uploaded")]
    total_mb = sum(r["bytes"] for r in pending) / 1024 / 1024
    print(f"=== upload  {len(pending)} files  {total_mb:.0f} MB  →  s3://{bucket}/ ===")
    if not pending:
        print("nothing to upload")
        return

    for i, row in enumerate(pending, 1):
        attempt = 0
        while True:
            try:
                client.upload_file(
                    row["src"], bucket, row["target_key"],
                    ExtraArgs={
                        "ContentType": "audio/mp4",
                        "CacheControl": "public, max-age=31536000, immutable",
                    },
                )
                head = client.head_object(Bucket=bucket, Key=row["target_key"])
                if head["ContentLength"] != row["bytes"]:
                    raise RuntimeError(f"size mismatch local={row['bytes']} r2={head['ContentLength']}")
                row["uploaded"] = True
                row["r2_etag"] = head.get("ETag", "").strip('"')
                save_state(state)
                print(f"  [{i:>3}/{len(pending)}] {row['target_key']}  {row['bytes']/1024/1024:>5.1f} MB  ok")
                break
            except (ClientError, RuntimeError) as e:
                attempt += 1
                if attempt >= 3:
                    print(f"  [{i:>3}/{len(pending)}] {row['target_key']}  FAILED after 3: {e}")
                    save_state(state)
                    die("aborting; rerun `upload` to resume")
                print(f"    retry {attempt}: {e}")
    print("upload complete")


def rewrite():
    state = load_state()
    uploaded = [r for r in state["rows"] if r.get("uploaded")]
    if not uploaded:
        die("no uploaded rows in state — run `upload` first")
    content = TRACKS_JS.read_text()
    original = content
    changed = 0
    for row in uploaded:
        old = f"'{row['raw']}'"
        new = f"'{row['target_url']}'"
        if old in content:
            content = content.replace(old, new, 1)
            changed += 1
    if content == original:
        print("no changes (already rewritten)")
        return
    TRACKS_JS.write_text(content)
    print(f"rewrote {changed} audioFile lines in {TRACKS_JS}")


def wipe_mw():
    mw = MIDDLEWARE.read_text()

    block_start = mw.find("  // ─── AUDIO FILE PROTECTION ───")
    block_end = mw.find("  // ─── PAGE ACCESS GATING ───")
    if block_start != -1 and block_end != -1:
        mw = mw[:block_start] + mw[block_end:]
        print("  removed AUDIO FILE PROTECTION block")
    else:
        print("  AUDIO FILE PROTECTION block not found (already wiped?)")

    fn_start = mw.find("// Verify audio token using Web Crypto API")
    fn_end = mw.find("export async function middleware(")
    if fn_start != -1 and fn_end != -1:
        mw = mw[:fn_start] + mw[fn_end:]
        print("  removed verifyAudioToken function")
    else:
        print("  verifyAudioToken function not found (already wiped?)")

    secret_re = re.compile(
        r"const AUDIO_SECRET = process\.env\.AUDIO_SECRET;\n"
        r"if \(!AUDIO_SECRET && process\.env\.NODE_ENV === 'production'\) \{\n"
        r"  console\.error\('FATAL: AUDIO_SECRET env var is not set'\);\n"
        r"\}\n\n",
    )
    new_mw = secret_re.sub("", mw)
    if new_mw != mw:
        mw = new_mw
        print("  removed AUDIO_SECRET env read")

    mw = re.sub(r"const \{ pathname, searchParams \} = request\.nextUrl;",
                "const { pathname } = request.nextUrl;", mw)

    MIDDLEWARE.write_text(mw)
    print(f"wiped audio gate from {MIDDLEWARE}")

    robots = ROBOTS.read_text()
    new_robots = robots.replace("Disallow: /audio/\n", "")
    if new_robots != robots:
        ROBOTS.write_text(new_robots)
        print(f"stripped Disallow: /audio/ from {ROBOTS}")
    else:
        print(f"no Disallow: /audio/ found in {ROBOTS}")


def cleanup():
    if not AUDIO_DIR.exists():
        print(f"{AUDIO_DIR} already absent")
        return
    state = load_state()
    not_uploaded = [r for r in state.get("rows", []) if r["kind"] == "local-exists" and not r.get("uploaded")]
    if not_uploaded:
        die(f"refusing to delete: {len(not_uploaded)} local files not yet uploaded to R2")
    sz_mb = sum(p.stat().st_size for p in AUDIO_DIR.rglob("*") if p.is_file()) / 1024 / 1024
    shutil.rmtree(AUDIO_DIR)
    print(f"deleted {AUDIO_DIR}  ({sz_mb:.0f} MB freed)")


PHASES = {
    "audit": audit,
    "upload": upload,
    "rewrite": rewrite,
    "wipe-mw": wipe_mw,
    "cleanup": cleanup,
}

USAGE = """usage: migrate.py <phase>
phases:
  audit       scan tracks.js + disk + R2 state, classify each audioFile
  upload      upload local-exists files to R2 with HEAD verify (idempotent)
  rewrite     rewrite uploaded paths in tracks.js to R2 URLs
  wipe-mw     strip middleware audio branch + robots Disallow
  cleanup     delete public/audio/
"""


def main():
    if len(sys.argv) != 2 or sys.argv[1] not in PHASES:
        print(USAGE)
        sys.exit(1)
    load_env()
    PHASES[sys.argv[1]]()


if __name__ == "__main__":
    main()
