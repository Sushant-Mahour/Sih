import json
import math
import os

def haversine(c1, c2):
    # c1, c2 are [lng, lat]
    lon1, lat1 = math.radians(c1[0]), math.radians(c1[1])
    lon2, lat2 = math.radians(c2[0]), math.radians(c2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return round(6371 * c, 2)

CITY_NODES = {
    'AS-KAM': {'id': 'AS-KAM', 'name': 'Guwahati', 'coords': [91.7362, 26.1445], 'state': 'Assam', 'type': 'trunk_hub'},
    'ML-EKH': {'id': 'ML-EKH', 'name': 'Shillong', 'coords': [91.8933, 25.5788], 'state': 'Meghalaya', 'type': 'staging_depot'},
    'AR-PAP': {'id': 'AR-PAP', 'name': 'Itanagar', 'coords': [93.6053, 27.0844], 'state': 'Arunachal Pradesh', 'type': 'staging_depot'},
    'NL-KOH': {'id': 'NL-KOH', 'name': 'Kohima', 'coords': [94.1086, 25.6751], 'state': 'Nagaland', 'type': 'mountain_hub'},
    'NL-DIM': {'id': 'NL-DIM', 'name': 'Dimapur', 'coords': [93.7276, 25.9063], 'state': 'Nagaland', 'type': 'railhead'},
    'MN-IMP': {'id': 'MN-IMP', 'name': 'Imphal', 'coords': [93.9368, 24.8170], 'state': 'Manipur', 'type': 'valley_terminal'},
    'MZ-AIZ': {'id': 'MZ-AIZ', 'name': 'Aizawl', 'coords': [92.7176, 23.7271], 'state': 'Mizoram', 'type': 'hill_hub'},
    'TR-WST': {'id': 'TR-WST', 'name': 'Agartala', 'coords': [91.2868, 23.8315], 'state': 'Tripura', 'type': 'border_staging'},
    'SK-EAS': {'id': 'SK-EAS', 'name': 'Gangtok', 'coords': [88.6138, 27.3314], 'state': 'Sikkim', 'type': 'forward_terminal'},
    'AS-CAC': {'id': 'AS-CAC', 'name': 'Silchar', 'coords': [92.7789, 24.8333], 'state': 'Assam', 'type': 'valley_distribution'},
    'AS-DIB': {'id': 'AS-DIB', 'name': 'Dibrugarh', 'coords': [94.9120, 27.4728], 'state': 'Assam', 'type': 'upper_depot'},
    'AS-JOR': {'id': 'AS-JOR', 'name': 'Jorhat', 'coords': [94.2037, 26.7509], 'state': 'Assam', 'type': 'waypoint'},
    'AS-SON': {'id': 'AS-SON', 'name': 'Tezpur', 'coords': [92.7926, 26.6528], 'state': 'Assam', 'type': 'access_hub'},
    'AR-TAW': {'id': 'AR-TAW', 'name': 'Tawang', 'coords': [91.8594, 27.5861], 'state': 'Arunachal Pradesh', 'type': 'mountain_base'},
    'ML-WJH': {'id': 'ML-WJH', 'name': 'Jowai', 'coords': [92.2000, 25.4500], 'state': 'Meghalaya', 'type': 'corridor_gateway'},
    'ML-WGH': {'id': 'ML-WGH', 'name': 'Tura', 'coords': [90.2027, 25.5140], 'state': 'Meghalaya', 'type': 'garo_depot'},
    'MZ-LUN': {'id': 'MZ-LUN', 'name': 'Lunglei', 'coords': [92.7340, 22.8879], 'state': 'Mizoram', 'type': 'south_depot'},
    'MN-CHU': {'id': 'MN-CHU', 'name': 'Churachandpur', 'coords': [93.6833, 24.3333], 'state': 'Manipur', 'type': 'waypoint'},
    'AR-EAS': {'id': 'AR-EAS', 'name': 'Pasighat', 'coords': [95.3333, 28.0667], 'state': 'Arunachal Pradesh', 'type': 'crossing_node'},
    'AR-WES': {'id': 'AR-WES', 'name': 'Bomdila', 'coords': [92.4159, 27.2645], 'state': 'Arunachal Pradesh', 'type': 'sela_approach'}
}

# Major Highway & District Road Graph Edges
ROAD_EDGES = [
    # National Highways (Trunk & Primary)
    {'from': 'AS-KAM', 'to': 'ML-EKH', 'name': 'NH-6 Guwahati-Shillong Expressway', 'highway': 'trunk', 'surface': 'asphalt', 'speedKmph': 60, 'riskBase': 15},
    {'from': 'ML-EKH', 'to': 'ML-WJH', 'name': 'NH-6 Shillong-Jowai High Ridge', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 45, 'riskBase': 35},
    {'from': 'ML-WJH', 'to': 'AS-CAC', 'name': 'NH-6 Jowai-Silchar Mountain Pass (Sonapur)', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 40, 'riskBase': 45},
    {'from': 'AS-CAC', 'to': 'TR-WST', 'name': 'NH-8 Silchar-Agartala Highway', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 50, 'riskBase': 25},
    {'from': 'AS-CAC', 'to': 'MZ-AIZ', 'name': 'NH-306 Silchar-Aizawl Corridor', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 40, 'riskBase': 30},
    {'from': 'MZ-AIZ', 'to': 'MZ-LUN', 'name': 'NH-54 Aizawl-Lunglei Ridge Pass', 'highway': 'secondary', 'surface': 'asphalt', 'speedKmph': 35, 'riskBase': 35},
    {'from': 'AS-CAC', 'to': 'MN-IMP', 'name': 'NH-37 Silchar-Jiribam-Imphal Highway', 'highway': 'primary', 'surface': 'paved', 'speedKmph': 40, 'riskBase': 40},
    {'from': 'MN-IMP', 'to': 'MN-CHU', 'name': 'NH-2 Imphal-Churachandpur Highway', 'highway': 'secondary', 'surface': 'asphalt', 'speedKmph': 50, 'riskBase': 20},
    {'from': 'NL-KOH', 'to': 'MN-IMP', 'name': 'NH-2 Kohima-Mao-Imphal Highway', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 45, 'riskBase': 35},
    {'from': 'NL-DIM', 'to': 'NL-KOH', 'name': 'NH-29 Dimapur-Kohima Mountain Climb', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 40, 'riskBase': 30},
    {'from': 'AS-KAM', 'to': 'AS-SON', 'name': 'NH-15 Guwahati-Tezpur Trunk Corridor', 'highway': 'trunk', 'surface': 'asphalt', 'speedKmph': 70, 'riskBase': 10},
    {'from': 'AS-SON', 'to': 'AR-PAP', 'name': 'NH-415 Tezpur-Itanagar Connector', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 55, 'riskBase': 20},
    {'from': 'AS-SON', 'to': 'AR-WES', 'name': 'NH-13 Bhalukpong-Bomdila Mountain Pass', 'highway': 'secondary', 'surface': 'paved', 'speedKmph': 35, 'riskBase': 40},
    {'from': 'AR-WES', 'to': 'AR-TAW', 'name': 'NH-13 Sela Pass Alpine Route (Tawang)', 'highway': 'secondary', 'surface': 'paved', 'speedKmph': 30, 'riskBase': 55},
    {'from': 'AS-SON', 'to': 'AS-JOR', 'name': 'Kolia Bhomora Bridge Crossing NH-715', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 65, 'riskBase': 15},
    {'from': 'AS-JOR', 'to': 'NL-DIM', 'name': 'NH-29 Jorhat-Dimapur Road', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 55, 'riskBase': 15},
    {'from': 'AS-JOR', 'to': 'AS-DIB', 'name': 'NH-2 Assam Valley Trunk Road', 'highway': 'trunk', 'surface': 'asphalt', 'speedKmph': 75, 'riskBase': 10},
    {'from': 'AS-DIB', 'to': 'AR-EAS', 'name': 'Bogibeel Bridge NH-515 to Pasighat', 'highway': 'primary', 'surface': 'asphalt', 'speedKmph': 65, 'riskBase': 15},
    {'from': 'AR-PAP', 'to': 'AR-EAS', 'name': 'NH-13 Trans-Arunachal Foothill Highway', 'highway': 'primary', 'surface': 'paved', 'speedKmph': 50, 'riskBase': 30},
    {'from': 'AS-KAM', 'to': 'ML-WGH', 'name': 'NH-17 Goalpara-Tura Garo Hills Link', 'highway': 'secondary', 'surface': 'asphalt', 'speedKmph': 50, 'riskBase': 25},
    {'from': 'ML-WGH', 'to': 'ML-EKH', 'name': 'SH-5 Nongstoin-Shillong Scenic Ridge', 'highway': 'secondary', 'surface': 'paved', 'speedKmph': 40, 'riskBase': 30},
    {'from': 'AS-KAM', 'to': 'SK-EAS', 'name': 'NH-27 Siliguri Corridor to Gangtok NH-10', 'highway': 'trunk', 'surface': 'asphalt', 'speedKmph': 60, 'riskBase': 25},
    
    # Secondary and District Alternative Bypass Roads (Crucial for Dijkstra's Offline Bypass)
    {'from': 'AS-KAM', 'to': 'AS-CAC', 'name': 'Lumding-Haflong Hill Bypass Rail & Road', 'highway': 'secondary', 'surface': 'asphalt', 'speedKmph': 45, 'riskBase': 25},
    {'from': 'AS-KAM', 'to': 'NL-DIM', 'name': 'Nagaon-Diphu Foothill Alternate Cut', 'highway': 'tertiary', 'surface': 'paved', 'speedKmph': 40, 'riskBase': 20},
    {'from': 'ML-EKH', 'to': 'AS-CAC', 'name': 'Mawngap-Pynursla-Dawki Border Bypass', 'highway': 'tertiary', 'surface': 'unpaved', 'speedKmph': 30, 'riskBase': 40},
    {'from': 'AS-SON', 'to': 'AR-TAW', 'name': 'Orang-Kalaktang Direct Border Bypass', 'highway': 'tertiary', 'surface': 'paved', 'speedKmph': 35, 'riskBase': 45},
    {'from': 'NL-DIM', 'to': 'MN-IMP', 'name': 'Peren-Tamenglong Mountain Bypass Track', 'highway': 'tertiary', 'surface': 'unpaved', 'speedKmph': 25, 'riskBase': 50},
    {'from': 'MZ-AIZ', 'to': 'TR-WST', 'name': 'Jampui Hills Tripura-Mizoram Forest Connector', 'highway': 'tertiary', 'surface': 'paved', 'speedKmph': 35, 'riskBase': 35}
]

def build_graph():
    nodes = CITY_NODES
    edges = []
    
    for idx, e in enumerate(ROAD_EDGES):
        c1 = nodes[e['from']]['coords']
        c2 = nodes[e['to']]['coords']
        dist = haversine(c1, c2)
        
        # Calculate base travel time
        hours = dist / e['speedKmph']
        timeMin = round(hours * 60)
        
        # Add forward edge
        edges.append({
            'edgeId': f"EDGE-{idx+1:03d}",
            'source': e['from'],
            'target': e['to'],
            'name': e['name'],
            'distanceKm': dist,
            'timeMinutes': timeMin,
            'speedKmph': e['speedKmph'],
            'highwayClass': e['highway'],
            'surface': e['surface'],
            'baseRisk': e['riskBase'],
            'pathCoordinates': [c1, c2]
        })
        
        # Add reverse edge (bidirectional road graph)
        edges.append({
            'edgeId': f"EDGE-{idx+1:03d}-R",
            'source': e['to'],
            'target': e['from'],
            'name': e['name'],
            'distanceKm': dist,
            'timeMinutes': timeMin,
            'speedKmph': e['speedKmph'],
            'highwayClass': e['highway'],
            'surface': e['surface'],
            'baseRisk': e['riskBase'],
            'pathCoordinates': [c2, c1]
        })
        
    graph_data = {
        'version': '2.0.0',
        'region': 'North Eastern Region (NER) India',
        'bbox': [87.5, 21.5, 97.6, 29.6],
        'nodeCount': len(nodes),
        'edgeCount': len(edges),
        'nodes': nodes,
        'edges': edges
    }
    
    os.makedirs('public/data', exist_ok=True)
    with open('public/data/road-graph.json', 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, indent=2)
    print(f"Generated road-graph.json: {len(nodes)} nodes, {len(edges)} directed edges")

if __name__ == '__main__':
    build_graph()
