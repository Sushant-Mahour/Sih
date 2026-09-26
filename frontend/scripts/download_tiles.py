import math
import os
import time
import urllib.request
import urllib.error

# Bounding box for the 8 North Eastern Region (NER) states
WEST = 87.5
SOUTH = 21.5
EAST = 97.6
NORTH = 29.6

HEADERS = {
    "User-Agent": "NIDAN/1.0 (Smart Logistics & Accessibility Command; contact: team@nerlogistics.gov.in)"
}

def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 1 << zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return xtile, ytile

def get_tile_range(zoom, west=WEST, south=SOUTH, east=EAST, north=NORTH):
    min_x, min_y = deg2num(north, west, zoom)
    max_x, max_y = deg2num(south, east, zoom)
    return range(min(min_x, max_x), max(min_x, max_x) + 1), range(min(min_y, max_y), max(min_y, max_y) + 1)

def download_tile(url, output_path, delay=0.04):
    if os.path.exists(output_path) and os.path.getsize(output_path) > 100:
        return True
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                with open(output_path, "wb") as f:
                    f.write(resp.read())
                time.sleep(delay)
                return True
    except Exception as e:
        # print(f"Tile {url} error: {e}")
        return False
    return False

def create_blank_png(path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if os.path.exists(path):
        return
    # 1x1 transparent/subtle PNG
    blank_png_bytes = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01'
        b'\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\rIDATx\x9cc\xf8\xff\xff'
        b'\x3f\x00\x05\xfe\x02\xfe\xa7T5a\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    with open(path, "wb") as f:
        f.write(blank_png_bytes)

def main():
    base_dir = os.path.join(os.path.dirname(__file__), "..", "public", "tiles")
    create_blank_png(os.path.join(base_dir, "blank.png"))
    
    print("=== STARTING NER MAP TILE DOWNLOAD (ZOOM 5-10) ===")
    total_downloaded = 0
    
    # 1. Download OpenStreetMap raster tiles (z5 to z9 regional + z10)
    for z in range(5, 10):
        x_range, y_range = get_tile_range(z)
        print(f"Downloading OSM Zoom {z}: X[{x_range.start}..{x_range.stop-1}], Y[{y_range.start}..{y_range.stop-1}] ({len(x_range)*len(y_range)} tiles)...")
        for x in x_range:
            for y in y_range:
                tile_path = os.path.join(base_dir, "osm", str(z), str(x), f"{y}.png")
                url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                if download_tile(url, tile_path, delay=0.03):
                    total_downloaded += 1

    # 2. Download OpenTopoMap Terrain tiles (z5 to z8)
    for z in range(5, 9):
        x_range, y_range = get_tile_range(z)
        print(f"Downloading Terrain Zoom {z}: ({len(x_range)*len(y_range)} tiles)...")
        for x in x_range:
            for y in y_range:
                tile_path = os.path.join(base_dir, "terrain", str(z), str(x), f"{y}.png")
                url = f"https://tile.opentopomap.org/{z}/{x}/{y}.png"
                if download_tile(url, tile_path, delay=0.08):
                    total_downloaded += 1

    print(f"=== COMPLETED TILE DOWNLOAD. Total tiles ready: {total_downloaded} ===")

if __name__ == "__main__":
    main()
