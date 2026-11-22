from pathlib import Path
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "_site"

# These paths are relative to the repository root.
SOURCES = {
    "goals": ROOT / "UWTS-Build" / "Compiled Mod" / "gfx" / "interface" / "goals",
    "ideas": ROOT / "UWTS-Build" / "Compiled Mod" / "gfx" / "interface" / "ideas",
    "modifiers": ROOT / "UWTS-Build" / "Compiled Mod" / "gfx" / "interface" / "modifiers",
}

# Browser-friendly formats. DDS/TGA are intentionally excluded because browsers
# do not display them consistently without conversion.
IMAGE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg", ".avif", ".bmp"
}

SITE_SOURCE = ROOT / "gfx-search"

def main():
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)

    # Copy the static frontend.
    for name in ("index.html", "style.css", "app.js"):
        source = SITE_SOURCE / name
        if not source.is_file():
            raise FileNotFoundError(f"Missing website file: {source}")
        shutil.copy2(source, OUTPUT / name)

    image_records = []
    missing_sources = []

    for category, source_dir in SOURCES.items():
        if not source_dir.is_dir():
            missing_sources.append(str(source_dir.relative_to(ROOT)))
            continue

        for source_file in sorted(source_dir.rglob("*")):
            if not source_file.is_file() or source_file.suffix.lower() not in IMAGE_EXTENSIONS:
                continue

            relative = source_file.relative_to(source_dir)
            destination = OUTPUT / "gfx" / category / relative
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_file, destination)

            web_path = destination.relative_to(OUTPUT).as_posix()
            image_records.append({
                "name": source_file.name,
                "stem": source_file.stem,
                "category": category,
                "categoryLabel": "Focuses" if category == "goals" "Ideas" else if category == "ideas" else "Modifiers",
                "folder": relative.parent.as_posix() if str(relative.parent) != "." else "",
                "path": web_path,
                "extension": source_file.suffix.lower().lstrip("."),
            })

    image_records.sort(key=lambda item: (item["category"], item["path"].lower()))
    (OUTPUT / "gfx-index.json").write_text(
        json.dumps({
            "images": image_records,
            "count": len(image_records),
            "missingSources": missing_sources,
        }, indent=2),
        encoding="utf-8",
    )

    print(f"Generated GFX Search with {len(image_records)} images.")
    if missing_sources:
        print("Warning: source directories not found:")
        for path in missing_sources:
            print(f"  - {path}")

if __name__ == "__main__":
    main()
